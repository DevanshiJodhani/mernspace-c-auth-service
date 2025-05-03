import { checkSchema } from 'express-validator/check'

export default checkSchema({
    email: {
        errorMessage: 'Email is required!',
        isEmpty: true,
    },
})

// export default [body('email').isEmpty().withMessage("Email is required!")]
