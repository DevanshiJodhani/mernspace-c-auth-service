import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import { Roles } from '../constants'
import { Config } from '../config'
import logger from '../config/logger'
import bcrypt from 'bcryptjs'

export const createAdminUser = async (): Promise<void> => {
    if (!Config.ADMIN_EMAIL || !Config.ADMIN_PASSWORD) {
        logger.warn('Admin credentials not provided. Skipping admin creation.')
        return
    }

    const userRepository = AppDataSource.getRepository(User)

    const existingAdmin = await userRepository.findOne({
        where: { role: Roles.ADMIN },
    })

    if (existingAdmin) {
        logger.info('Admin user already exists')
        return
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(Config.ADMIN_PASSWORD, saltRounds)

    const admin = userRepository.create({
        firstName: Config.ADMIN_FIRST_NAME || 'System',
        lastName: Config.ADMIN_LAST_NAME || 'Admin',
        email: Config.ADMIN_EMAIL,
        password: hashedPassword,
        role: Roles.ADMIN,
    })

    await userRepository.save(admin)

    logger.info(`Admin user created: ${admin.email}`)
}
