"""
Question Bank — Storage & Smart Retrieval

This is the CORE of the "generate once, query forever" strategy.

Storage: ChromaDB (vector search) + SQLite (metadata filtering)
- ChromaDB: Semantic similarity search on question text + concepts
- SQLite: Fast exact-match filtering on 30+ metadata fields

Query Flow:
1. Parse QuestionBankQuery into filters
2. If semantic_query provided → ChromaDB semantic search with metadata filters
3. If only metadata filters → SQLite direct query (fastest)
4. Combine, deduplicate, randomize, return

Performance Target: <100ms for any query pattern
"""
import json
import random
import sqlite3
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from pinecone import Pinecone
from app.core.config import settings
from app.data.embeddings import get_embeddings, get_embedding_fn

from app.core.logging import get_logger
from app.models.question_schema import (
    QuestionBankItem,
    QuestionBankQuery,
    QueryResult,
    Subject,
    Difficulty,
    QuestionType,
    QuestionStyle,
    BloomLevel,
    CognitiveType,
    JEEFrequency,
    ValidationStatus,
)

logger = get_logger(__name__)

# Database paths
BANK_DIR = "./app/data/question_bank"
SQLITE_PATH = f"{BANK_DIR}/questions.db"


class QuestionBank:
    """
    The question bank — stores and retrieves richly-tagged questions.
    
    Dual storage:
    - Pinecone: For semantic/similarity search
    - SQLite: For fast metadata filtering
    """
    
    def __init__(
        self,
        sqlite_path: str = SQLITE_PATH,
    ):
        """Initialize the question bank with dual storage."""
        Path(sqlite_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Pinecone for semantic search
        if not settings.PINECONE_API_KEY:
            logger.error("pinecone_api_key_missing")
            self.index = None
        else:
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            self.index = pc.Index(settings.PINECONE_INDEX_NAME)
        
        # SQLite for structured queries
        self.sqlite_path = sqlite_path
        self._init_sqlite()
        
        logger.info(
            "question_bank_initialized",
            sqlite_path=sqlite_path,
        )
    
    # =========================================================================
    # SQLITE SETUP
    # =========================================================================
    
    def _init_sqlite(self):
        """Create SQLite tables if they don't exist."""
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                question_text TEXT NOT NULL,
                options TEXT,  -- JSON array
                correct_answer TEXT NOT NULL,
                question_type TEXT NOT NULL,
                
                -- Academic classification
                subject TEXT NOT NULL,
                chapter TEXT NOT NULL,
                topic TEXT NOT NULL,
                sub_topics TEXT,  -- pipe-separated
                class_level INTEGER NOT NULL,
                category TEXT NOT NULL,
                
                -- Difficulty
                difficulty TEXT NOT NULL,
                difficulty_score REAL NOT NULL,
                
                -- Cognitive
                bloom_level TEXT NOT NULL,
                cognitive_type TEXT NOT NULL,
                question_style TEXT NOT NULL,
                
                -- Skills (pipe-separated for LIKE queries)
                concepts_tested TEXT,
                formulas_used TEXT,
                skills_required TEXT,
                prerequisite_topics TEXT,
                error_prone_areas TEXT,
                common_mistakes TEXT,
                
                -- Exam intelligence
                estimated_time_seconds INTEGER,
                marks INTEGER DEFAULT 4,
                negative_marks INTEGER DEFAULT -1,
                solution_approach TEXT,
                solution_steps_count INTEGER,
                multi_concept BOOLEAN DEFAULT 0,
                
                -- JEE relevance
                jee_years TEXT,  -- pipe-separated
                jee_frequency TEXT,
                weightage_percent REAL,
                
                -- Diagram
                requires_diagram BOOLEAN DEFAULT 0,
                diagram_type TEXT,
                
                -- Quality
                quality_score REAL DEFAULT 0.0,
                validation_status TEXT DEFAULT 'pending',
                
                -- Tags (pipe-separated for LIKE queries)
                tags TEXT,
                
                -- Solution (JSON)
                solution_json TEXT,
                
                -- Generation metadata
                batch_id TEXT,
                generated_at TEXT,
                
                -- Full JSON (for complete retrieval)
                full_json TEXT NOT NULL
            )
        """)
        
        # Create indexes for common query patterns
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_subject ON questions(subject)",
            "CREATE INDEX IF NOT EXISTS idx_chapter ON questions(subject, chapter)",
            "CREATE INDEX IF NOT EXISTS idx_topic ON questions(subject, chapter, topic)",
            "CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(difficulty)",
            "CREATE INDEX IF NOT EXISTS idx_difficulty_score ON questions(difficulty_score)",
            "CREATE INDEX IF NOT EXISTS idx_question_type ON questions(question_type)",
            "CREATE INDEX IF NOT EXISTS idx_bloom ON questions(bloom_level)",
            "CREATE INDEX IF NOT EXISTS idx_cognitive ON questions(cognitive_type)",
            "CREATE INDEX IF NOT EXISTS idx_style ON questions(question_style)",
            "CREATE INDEX IF NOT EXISTS idx_time ON questions(estimated_time_seconds)",
            "CREATE INDEX IF NOT EXISTS idx_quality ON questions(quality_score)",
            "CREATE INDEX IF NOT EXISTS idx_validation ON questions(validation_status)",
            "CREATE INDEX IF NOT EXISTS idx_class ON questions(class_level)",
            "CREATE INDEX IF NOT EXISTS idx_category ON questions(category)",
            "CREATE INDEX IF NOT EXISTS idx_multi_concept ON questions(multi_concept)",
            "CREATE INDEX IF NOT EXISTS idx_batch ON questions(batch_id)",
            # Compound indexes for common query combos
            "CREATE INDEX IF NOT EXISTS idx_subj_diff_type ON questions(subject, difficulty, question_type)",
            "CREATE INDEX IF NOT EXISTS idx_subj_chap_diff ON questions(subject, chapter, difficulty)",
            "CREATE INDEX IF NOT EXISTS idx_subj_bloom ON questions(subject, bloom_level)",
        ]
        
        for idx_sql in indexes:
            cursor.execute(idx_sql)
        
        conn.commit()
        conn.close()
    
    # =========================================================================
    # STORE QUESTIONS
    # =========================================================================
    
    def store_question(self, item: QuestionBankItem) -> bool:
        """
        Store a single question in both ChromaDB and SQLite.
        
        Args:
            item: Fully enriched QuestionBankItem
            
        Returns:
            True if stored successfully
        """
        try:
            # Store in Pinecone (for semantic search)
            if self.index:
                embeddings = get_embeddings([item.to_search_text()])
                self.index.upsert(
                    vectors=[{
                        "id": item.id,
                        "values": embeddings[0],
                        "metadata": item.to_flat_metadata()
                    }]
                )
            
            # Store in SQLite (for structured queries)
            self._sqlite_upsert(item)
            
            return True
            
        except Exception as e:
            logger.error("store_question_failed", id=item.id, error=str(e))
            return False
    
    def store_batch(self, items: List[QuestionBankItem]) -> Tuple[int, int]:
        """
        Store a batch of questions efficiently.
        
        Returns:
            Tuple of (success_count, failure_count)
        """
        success = 0
        failure = 0
        
        # Batch Pinecone upsert
        if items and self.index:
            try:
                texts = [item.to_search_text() for item in items]
                embeddings = get_embeddings(texts)
                vectors = []
                for i, item in enumerate(items):
                    vectors.append({
                        "id": item.id,
                        "values": embeddings[i],
                        "metadata": item.to_flat_metadata()
                    })
                self.index.upsert(vectors=vectors)
            except Exception as e:
                logger.error("pinecone_batch_upsert_failed", error=str(e))
        
        # Batch SQLite insert
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        
        for item in items:
            try:
                self._sqlite_insert_row(cursor, item)
                success += 1
            except Exception as e:
                logger.warning("sqlite_insert_failed", id=item.id, error=str(e))
                failure += 1
        
        conn.commit()
        conn.close()
        
        logger.info(
            "batch_stored",
            total=len(items),
            success=success,
            failure=failure,
        )
        
        return success, failure
    
    def _sqlite_upsert(self, item: QuestionBankItem):
        """Insert or update a question in SQLite."""
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        self._sqlite_insert_row(cursor, item)
        conn.commit()
        conn.close()
    
    def _sqlite_insert_row(self, cursor: sqlite3.Cursor, item: QuestionBankItem):
        """Insert a single row into SQLite."""
        cursor.execute("""
            INSERT OR REPLACE INTO questions (
                id, question_text, options, correct_answer, question_type,
                subject, chapter, topic, sub_topics, class_level, category,
                difficulty, difficulty_score,
                bloom_level, cognitive_type, question_style,
                concepts_tested, formulas_used, skills_required,
                prerequisite_topics, error_prone_areas, common_mistakes,
                estimated_time_seconds, marks, negative_marks,
                solution_approach, solution_steps_count, multi_concept,
                jee_years, jee_frequency, weightage_percent,
                requires_diagram, diagram_type,
                quality_score, validation_status,
                tags, solution_json, batch_id, generated_at,
                full_json
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?,
                ?, ?,
                ?, ?, ?, ?,
                ?
            )
        """, (
            item.id,
            item.core.question_text,
            json.dumps(item.core.options),
            item.core.correct_answer,
            item.core.question_type.value,
            item.classification.subject.value,
            item.classification.chapter,
            item.classification.topic,
            "|".join(item.classification.sub_topics),
            item.classification.class_level,
            item.classification.category,
            item.difficulty_info.difficulty.value,
            item.difficulty_info.difficulty_score,
            item.cognitive.bloom_level.value,
            item.cognitive.cognitive_type.value,
            item.cognitive.question_style.value,
            "|".join(item.skills.concepts_tested),
            "|".join(item.skills.formulas_used),
            "|".join(item.skills.skills_required),
            "|".join(item.skills.prerequisite_topics),
            "|".join(item.skills.error_prone_areas),
            "|".join(item.skills.common_mistakes),
            item.exam_info.estimated_time_seconds,
            item.exam_info.marks,
            item.exam_info.negative_marks,
            item.exam_info.solution_approach.value if item.exam_info.solution_approach else "",
            item.exam_info.solution_steps_count,
            1 if item.exam_info.multi_concept else 0,
            "|".join(str(y) for y in item.jee_relevance.years_appeared),
            item.jee_relevance.frequency.value,
            item.jee_relevance.weightage_percent,
            1 if item.diagram.requires_diagram else 0,
            item.diagram.diagram_type or "",
            item.quality.quality_score,
            item.quality.validation_status.value,
            "|".join(item.tags),
            json.dumps(item.solution.model_dump()) if item.solution else "{}",
            item.generation.batch_id,
            item.generation.generated_at.isoformat(),
            item.model_dump_json(),
        ))
    
    # =========================================================================
    # QUERY — The star of the show
    # =========================================================================
    
    def query(self, q: QuestionBankQuery) -> QueryResult:
        """
        Smart query — the main entry point for retrieving questions.
        
        Strategy:
        1. If semantic_query → use ChromaDB with metadata pre-filter
        2. Otherwise → pure SQLite (fastest)
        3. Apply exclusions, randomization, pagination
        
        Args:
            q: QuestionBankQuery with any combination of filters
            
        Returns:
            QueryResult with matching questions
        """
        start_time = time.time()
        
        if q.semantic_query:
            result = self._semantic_query(q)
        else:
            result = self._structured_query(q)
        
        query_time = (time.time() - start_time) * 1000  # ms
        result.query_time_ms = round(query_time, 2)
        
        logger.info(
            "question_bank_query",
            count_returned=len(result.questions),
            total_matching=result.total_matching,
            query_time_ms=result.query_time_ms,
            has_semantic=bool(q.semantic_query),
        )
        
        return result
    
    def _structured_query(self, q: QuestionBankQuery) -> QueryResult:
        """Pure SQL query — fastest path when no semantic search needed."""
        where_clauses = []
        params = []
        
        # Build WHERE clause from filters
        if q.subjects:
            placeholders = ",".join(["?" for _ in q.subjects])
            where_clauses.append(f"subject IN ({placeholders})")
            params.extend([s.value for s in q.subjects])
        
        if q.chapters:
            placeholders = ",".join(["?" for _ in q.chapters])
            where_clauses.append(f"chapter IN ({placeholders})")
            params.extend(q.chapters)
        
        if q.topics:
            placeholders = ",".join(["?" for _ in q.topics])
            where_clauses.append(f"topic IN ({placeholders})")
            params.extend(q.topics)
        
        if q.categories:
            placeholders = ",".join(["?" for _ in q.categories])
            where_clauses.append(f"category IN ({placeholders})")
            params.extend(q.categories)
        
        if q.class_levels:
            placeholders = ",".join(["?" for _ in q.class_levels])
            where_clauses.append(f"class_level IN ({placeholders})")
            params.extend(q.class_levels)
        
        if q.difficulties:
            placeholders = ",".join(["?" for _ in q.difficulties])
            where_clauses.append(f"difficulty IN ({placeholders})")
            params.extend([d.value for d in q.difficulties])
        
        if q.min_difficulty_score is not None:
            where_clauses.append("difficulty_score >= ?")
            params.append(q.min_difficulty_score)
        
        if q.max_difficulty_score is not None:
            where_clauses.append("difficulty_score <= ?")
            params.append(q.max_difficulty_score)
        
        if q.question_types:
            placeholders = ",".join(["?" for _ in q.question_types])
            where_clauses.append(f"question_type IN ({placeholders})")
            params.extend([qt.value for qt in q.question_types])
        
        if q.question_styles:
            placeholders = ",".join(["?" for _ in q.question_styles])
            where_clauses.append(f"question_style IN ({placeholders})")
            params.extend([qs.value for qs in q.question_styles])
        
        if q.bloom_levels:
            placeholders = ",".join(["?" for _ in q.bloom_levels])
            where_clauses.append(f"bloom_level IN ({placeholders})")
            params.extend([bl.value for bl in q.bloom_levels])
        
        if q.cognitive_types:
            placeholders = ",".join(["?" for _ in q.cognitive_types])
            where_clauses.append(f"cognitive_type IN ({placeholders})")
            params.extend([ct.value for ct in q.cognitive_types])
        
        if q.concepts_include:
            for concept in q.concepts_include:
                where_clauses.append("concepts_tested LIKE ?")
                params.append(f"%{concept}%")
        
        if q.concepts_exclude:
            for concept in q.concepts_exclude:
                where_clauses.append("concepts_tested NOT LIKE ?")
                params.append(f"%{concept}%")
        
        if q.skills_include:
            for skill in q.skills_include:
                where_clauses.append("skills_required LIKE ?")
                params.append(f"%{skill}%")
        
        if q.max_time_seconds:
            where_clauses.append("estimated_time_seconds <= ?")
            params.append(q.max_time_seconds)
        
        if q.solution_approaches:
            placeholders = ",".join(["?" for _ in q.solution_approaches])
            where_clauses.append(f"solution_approach IN ({placeholders})")
            params.extend([sa.value for sa in q.solution_approaches])
        
        if q.multi_concept_only is not None:
            where_clauses.append("multi_concept = ?")
            params.append(1 if q.multi_concept_only else 0)
        
        if q.tags_include:
            for tag in q.tags_include:
                where_clauses.append("tags LIKE ?")
                params.append(f"%{tag}%")
        
        if q.tags_exclude:
            for tag in q.tags_exclude:
                where_clauses.append("tags NOT LIKE ?")
                params.append(f"%{tag}%")
        
        if q.error_areas_include:
            for area in q.error_areas_include:
                where_clauses.append("error_prone_areas LIKE ?")
                params.append(f"%{area}%")
        
        if q.min_quality_score is not None:
            where_clauses.append("quality_score >= ?")
            params.append(q.min_quality_score)
        
        if q.validation_statuses:
            placeholders = ",".join(["?" for _ in q.validation_statuses])
            where_clauses.append(f"validation_status IN ({placeholders})")
            params.extend([vs.value for vs in q.validation_statuses])
        
        if q.exclude_ids:
            placeholders = ",".join(["?" for _ in q.exclude_ids])
            where_clauses.append(f"id NOT IN ({placeholders})")
            params.extend(q.exclude_ids)
        
        if q.jee_years:
            year_conditions = []
            for year in q.jee_years:
                year_conditions.append("jee_years LIKE ?")
                params.append(f"%{year}%")
            where_clauses.append(f"({' OR '.join(year_conditions)})")
        
        # Build final SQL
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        # Count total matching
        count_sql = f"SELECT COUNT(*) FROM questions WHERE {where_sql}"
        
        # Order and pagination
        order_sql = "ORDER BY RANDOM()" if q.randomize else "ORDER BY quality_score DESC"
        limit_sql = f"LIMIT ? OFFSET ?"
        
        select_sql = f"SELECT full_json FROM questions WHERE {where_sql} {order_sql} {limit_sql}"
        
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute(count_sql, params)
        total_matching = cursor.fetchone()[0]
        
        # Get results
        cursor.execute(select_sql, params + [q.count, q.offset])
        rows = cursor.fetchall()
        conn.close()
        
        # Parse results
        questions = []
        for row in rows:
            try:
                item = QuestionBankItem.model_validate_json(row[0])
                questions.append(item)
            except Exception as e:
                logger.warning("question_parse_failed", error=str(e))
        
        # Build filters summary
        filters_applied = {}
        if q.subjects:
            filters_applied["subjects"] = [s.value for s in q.subjects]
        if q.chapters:
            filters_applied["chapters"] = q.chapters
        if q.difficulties:
            filters_applied["difficulties"] = [d.value for d in q.difficulties]
        if q.question_types:
            filters_applied["question_types"] = [qt.value for qt in q.question_types]
        if q.bloom_levels:
            filters_applied["bloom_levels"] = [bl.value for bl in q.bloom_levels]
        
        return QueryResult(
            questions=questions,
            total_matching=total_matching,
            query_time_ms=0,  # Will be set by caller
            filters_applied=filters_applied,
        )
    
    def _semantic_query(self, q: QuestionBankQuery) -> QueryResult:
        """Semantic search via Pinecone with optional metadata pre-filtering."""
        if not self.index:
            return self._structured_query(q)

        # Build Pinecone filter from query
        pinecone_filter = {}
        
        if q.subjects and len(q.subjects) == 1:
            pinecone_filter["subject"] = q.subjects[0].value
        
        if q.difficulties and len(q.difficulties) == 1:
            pinecone_filter["difficulty"] = q.difficulties[0].value
        
        if q.question_types and len(q.question_types) == 1:
            pinecone_filter["question_type"] = q.question_types[0].value
        
        if q.chapters and len(q.chapters) == 1:
            pinecone_filter["chapter"] = q.chapters[0]
        
        try:
            # Get embedding for semantic query
            query_embedding = get_embeddings([q.semantic_query])[0]

            # Fetch more results than needed for post-filtering
            fetch_count = min(q.count * 3, 100)
            
            results = self.index.query(
                vector=query_embedding,
                top_k=fetch_count,
                filter=pinecone_filter if pinecone_filter else None,
                include_metadata=False, # We get the full data from SQLite anyway
            )
            
            if not results["matches"]:
                return QueryResult(
                    questions=[], total_matching=0, query_time_ms=0, filters_applied={}
                )
            
            # Get full question data from SQLite for matched IDs
            matched_ids = [match.id for match in results.matches]
            
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            
            placeholders = ",".join(["?" for _ in matched_ids])
            cursor.execute(
                f"SELECT full_json FROM questions WHERE id IN ({placeholders})",
                matched_ids
            )
            rows = cursor.fetchall()
            conn.close()
            
            # Parse and apply additional filters
            questions = []
            for row in rows:
                try:
                    item = QuestionBankItem.model_validate_json(row[0])
                    if self._matches_query(item, q):
                        questions.append(item)
                except Exception as e:
                    logger.warning("semantic_result_parse_failed", error=str(e))
            
            # Exclude IDs
            if q.exclude_ids:
                questions = [qn for qn in questions if qn.id not in q.exclude_ids]
            
            # Randomize if requested
            if q.randomize:
                random.shuffle(questions)
            
            # Apply limit
            total = len(questions)
            questions = questions[q.offset:q.offset + q.count]
            
            return QueryResult(
                questions=questions,
                total_matching=total,
                query_time_ms=0,
                filters_applied={"semantic_query": q.semantic_query},
            )
            
        except Exception as e:
            logger.error("semantic_query_failed", error=str(e))
            # Fallback to structured query
            return self._structured_query(q)
    
    def _matches_query(self, item: QuestionBankItem, q: QuestionBankQuery) -> bool:
        """Post-filter check for semantic search results."""
        if q.subjects and item.classification.subject not in q.subjects:
            return False
        if q.chapters and item.classification.chapter not in q.chapters:
            return False
        if q.difficulties and item.difficulty_info.difficulty not in q.difficulties:
            return False
        if q.question_types and item.core.question_type not in q.question_types:
            return False
        if q.bloom_levels and item.cognitive.bloom_level not in q.bloom_levels:
            return False
        if q.min_quality_score and item.quality.quality_score < q.min_quality_score:
            return False
        if q.max_time_seconds and item.exam_info.estimated_time_seconds > q.max_time_seconds:
            return False
        return True
    
    # =========================================================================
    # CONVENIENCE METHODS — Common query patterns
    # =========================================================================
    
    def get_test_questions(
        self,
        subjects: List[str],
        mcq_per_subject: int = 20,
        numerical_per_subject: int = 10,
        difficulty_mix: str = "mixed",
        exclude_ids: Optional[List[str]] = None,
    ) -> List[QuestionBankItem]:
        """
        Get questions for a full mock test — NO LLM calls.
        
        Args:
            subjects: List of subjects
            mcq_per_subject: MCQ count per subject
            numerical_per_subject: Numerical count per subject
            difficulty_mix: 'easy', 'medium', 'hard', or 'mixed'
            exclude_ids: IDs to exclude (prevent repetition)
        
        Returns:
            List of questions structured for a test
        """
        all_questions = []
        
        for subject in subjects:
            subj_enum = Subject(subject.lower())
            
            # Get MCQs
            if difficulty_mix == "mixed":
                # Distribute: 35% easy, 35% medium, 30% hard
                easy_count = max(int(mcq_per_subject * 0.35), 1)
                medium_count = max(int(mcq_per_subject * 0.35), 1)
                hard_count = mcq_per_subject - easy_count - medium_count
                
                for diff, count in [("easy", easy_count), ("medium", medium_count), ("hard", hard_count)]:
                    result = self.query(QuestionBankQuery(
                        subjects=[subj_enum],
                        question_types=[QuestionType.MCQ],
                        difficulties=[Difficulty(diff)],
                        count=count,
                        exclude_ids=exclude_ids,
                        min_quality_score=0.6,
                    ))
                    all_questions.extend(result.questions)
            else:
                result = self.query(QuestionBankQuery(
                    subjects=[subj_enum],
                    question_types=[QuestionType.MCQ],
                    difficulties=[Difficulty(difficulty_mix)],
                    count=mcq_per_subject,
                    exclude_ids=exclude_ids,
                    min_quality_score=0.6,
                ))
                all_questions.extend(result.questions)
            
            # Get Numerical
            result = self.query(QuestionBankQuery(
                subjects=[subj_enum],
                question_types=[QuestionType.NUMERICAL],
                count=numerical_per_subject,
                exclude_ids=exclude_ids,
                min_quality_score=0.6,
            ))
            all_questions.extend(result.questions)
        
        return all_questions
    
    def get_adaptive_practice(
        self,
        subject: str,
        weak_topics: List[str],
        weak_concepts: Optional[List[str]] = None,
        error_areas: Optional[List[str]] = None,
        count: int = 10,
        start_bloom: str = "understand",
        exclude_ids: Optional[List[str]] = None,
    ) -> List[QuestionBankItem]:
        """
        Get questions for adaptive practice — targets weaknesses.
        
        Progression: easy conceptual → medium procedural → hard application
        """
        questions = []
        
        # Phase 1: Conceptual understanding (40% of questions)
        conceptual_count = max(int(count * 0.4), 1)
        result = self.query(QuestionBankQuery(
            subjects=[Subject(subject.lower())],
            topics=weak_topics,
            bloom_levels=[BloomLevel.UNDERSTAND, BloomLevel.REMEMBER],
            difficulties=[Difficulty.EASY, Difficulty.MEDIUM],
            question_styles=[QuestionStyle.CONCEPTUAL],
            concepts_include=weak_concepts,
            count=conceptual_count,
            exclude_ids=exclude_ids,
        ))
        questions.extend(result.questions)
        
        # Phase 2: Procedural practice (35%)
        procedural_count = max(int(count * 0.35), 1)
        used_ids = [qn.id for qn in questions] + (exclude_ids or [])
        result = self.query(QuestionBankQuery(
            subjects=[Subject(subject.lower())],
            topics=weak_topics,
            bloom_levels=[BloomLevel.APPLY],
            difficulties=[Difficulty.MEDIUM],
            concepts_include=weak_concepts,
            error_areas_include=error_areas,
            count=procedural_count,
            exclude_ids=used_ids,
        ))
        questions.extend(result.questions)
        
        # Phase 3: Application/Analysis (25%)
        analysis_count = count - len(questions)
        if analysis_count > 0:
            used_ids = [qn.id for qn in questions] + (exclude_ids or [])
            result = self.query(QuestionBankQuery(
                subjects=[Subject(subject.lower())],
                topics=weak_topics,
                bloom_levels=[BloomLevel.ANALYZE, BloomLevel.EVALUATE],
                difficulties=[Difficulty.MEDIUM, Difficulty.HARD],
                concepts_include=weak_concepts,
                count=analysis_count,
                exclude_ids=used_ids,
            ))
            questions.extend(result.questions)
        
        return questions
    
    # =========================================================================
    # STATS
    # =========================================================================
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics about the question bank."""
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Total count
        cursor.execute("SELECT COUNT(*) FROM questions")
        stats["total_questions"] = cursor.fetchone()[0]
        
        # By subject
        cursor.execute("SELECT subject, COUNT(*) FROM questions GROUP BY subject")
        stats["by_subject"] = dict(cursor.fetchall())
        
        # By chapter (top 20)
        cursor.execute("""
            SELECT chapter, COUNT(*) as cnt 
            FROM questions 
            GROUP BY chapter 
            ORDER BY cnt DESC 
            LIMIT 20
        """)
        stats["top_chapters"] = dict(cursor.fetchall())
        
        # By difficulty
        cursor.execute("SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty")
        stats["by_difficulty"] = dict(cursor.fetchall())
        
        # By question type
        cursor.execute("SELECT question_type, COUNT(*) FROM questions GROUP BY question_type")
        stats["by_type"] = dict(cursor.fetchall())
        
        # By bloom level
        cursor.execute("SELECT bloom_level, COUNT(*) FROM questions GROUP BY bloom_level")
        stats["by_bloom"] = dict(cursor.fetchall())
        
        # Quality distribution
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN quality_score >= 0.8 THEN 'high (≥0.8)'
                    WHEN quality_score >= 0.6 THEN 'medium (0.6-0.8)'
                    ELSE 'low (<0.6)'
                END as tier,
                COUNT(*)
            FROM questions GROUP BY tier
        """)
        stats["quality_distribution"] = dict(cursor.fetchall())
        
        # Validation status
        cursor.execute("SELECT validation_status, COUNT(*) FROM questions GROUP BY validation_status")
        stats["by_validation"] = dict(cursor.fetchall())
        
        conn.close()
        return stats
    
    def get_chapter_coverage(self, subject: str) -> Dict[str, int]:
        """Get question count per chapter for a subject."""
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT chapter, COUNT(*) FROM questions WHERE subject = ? GROUP BY chapter ORDER BY COUNT(*) DESC",
            (subject.lower(),)
        )
        coverage = dict(cursor.fetchall())
        conn.close()
        return coverage


# =============================================================================
# SINGLETON
# =============================================================================

_question_bank: Optional[QuestionBank] = None
_qb_lock = __import__('threading').Lock()


def get_question_bank() -> QuestionBank:
    """Get the singleton question bank instance (thread-safe)."""
    global _question_bank
    if _question_bank is None:
        with _qb_lock:
            if _question_bank is None:
                _question_bank = QuestionBank()
    return _question_bank
