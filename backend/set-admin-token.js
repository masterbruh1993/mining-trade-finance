const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE5NGJkY2Q0YzQ0NjU4OGIzMzdiZCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzA5OTEzOCwiZXhwIjoxNzU3MTg1NTM4fQ.LqUBCJi0eCaeI-KB80KpvG4tqmwwwhDTqiWHE2j22VY";
localStorage.setItem("token", adminToken);
console.log("Admin token set in localStorage");
window.location.reload();
