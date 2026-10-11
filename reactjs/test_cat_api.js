fetch('http://localhost:8081/api/public/categories')
  .then(r => r.json())
  .then(data => console.log("Categories in DB:", JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
