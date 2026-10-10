import { z } from 'zod'
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid record id.')
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params })
    if (!result.success) return res.status(400).json({ error: 'Please check the highlighted information.', details: result.error.flatten() })
    req.validated = result.data
    next()
  }
}
