// api/config.js
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/javascript");
  res.status(200).send(`
    window.ENV = {
      ADMIN_PASSWORD: "${process.env.ADMIN}"
    };
  `);
}
