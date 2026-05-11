const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 'cmp08ur7v00009dutwn8m91wf', email: 'test@test.com', role: 'LEARNER' }, 'dev-access-secret', { expiresIn: '15m' });

fetch('http://localhost:3000/test-threads/cmp092u0200069dutdj2mpgoi/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: "generate a 3 question test on kinematics" })
}).then(r => r.json()).then(console.log).catch(console.error);
