const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

module.exports = validate; 