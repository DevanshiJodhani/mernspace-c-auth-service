import app from './app'
import { createAdminUser } from './bootstrap/createAdminUser'
import { Config } from './config'
import { AppDataSource } from './config/data-source'
import logger from './config/logger'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected successfully!')

        // ADMIN AUTO-CREATION
        await createAdminUser()

        app.listen(PORT, () => {
            logger.info('Server listening on port', { port: PORT })
        })
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

void startServer()
