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

app.use(express.static('public'))
app.use(
    cors({
        origin: Config.CLIENT_URL,
        credentials: true,
    }),
)
app.use(cookieParser())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to auth service.')
})

app.use(jwksRoutes)
app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
app.use('/users', userRouter)

// Global Error handler
app.use(globalErrorHandler)

export default app
