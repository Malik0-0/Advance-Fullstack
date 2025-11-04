import app from "./app";
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cart API running at http://localhost:${PORT}`));
