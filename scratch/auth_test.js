const axios = require('axios');
(async () => {
  try {
    const register = await axios.post('https://quiznova-ai-grdq.onrender.com/api/auth/register', {
      name: 'Test User',
      email: 'test2@example.com',
      password: 'test123',
      role: 'Student'
    });
    console.log('Register response:', register.data);
    const login = await axios.post('https://quiznova-ai-grdq.onrender.com/api/auth/login', {
      email: 'test2@example.com',
      password: 'test123'
    });
    console.log('Login response:', login.data);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err);
    }
  }
})();
