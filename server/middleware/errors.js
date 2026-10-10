export function notFound(req, res) { res.status(404).json({ error: `No route for ${req.method} ${req.path}` }) }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  const status = err.status || (err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 404 : 500)
  if (err.code === 11000) return res.status(409).json({ error: 'That record already exists.' })
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message, details: process.env.NODE_ENV === 'development' ? err.message : undefined })
}
