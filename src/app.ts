import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import authRouter from './routes/auth'
import tenantRouter from './routes/tenant'
import userRouter from './routes/user'
import jwksRoutes from './routes/jwks'
import { globalErrorHandler } from './middlewares/globalErrorHandler'
import { Config } from './config'

const app = express()

app.set('trust proxy', 1)

app.use(express.static('public'))

app.use(
    cors({
        origin: function (origin, callback) {
            const allowedOrigins = [Config.ADMIN_URL, Config.CLIENT_URL]

            if (!origin) return callback(null, true)

            if (allowedOrigins.includes(origin)) {
                return callback(null, true)
            } else {
                return callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true,
    }),
)

app.use(cookieParser())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to auth service.')
})

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send('Auth service running perfectly')
})

app.use(jwksRoutes)
app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
app.use('/users', userRouter)

// Global Error handler
app.use(globalErrorHandler)

export default app
