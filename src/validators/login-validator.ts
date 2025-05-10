import { checkSchema } from 'express-validator/check'

export default checkSchema({
    email: {
        errorMessage: 'Email is required!',
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: 'Email shoud be a valid!',
        },
    },

    password: {
        errorMessage: 'Password is required!',
        notEmpty: true,
        trim: true,
    },
})

// export default [body('email').isEmpty().withMessage("Email is required!")]
