import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { createTenant } from '../utils'
import { Tenant } from '../../src/entity/Tenant'

describe('POST /users', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')

        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // Database truncate
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('Should persist the user in the database', async () => {
            // Create tenant
            const tenant = await createTenant(connection.getRepository(Tenant))

            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Register user
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
                tenantId: tenant.id,
                role: Roles.MANAGER,
            }

            // Add token to cookie
            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            // Assert
            expect(users).toHaveLength(1)
            expect(users[0].email).toBe(userData.email)
        })

        it('Should create a manager user', async () => {
            // Create tenant
            const tenant = await createTenant(connection.getRepository(Tenant))

            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Register user
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
                tenantId: tenant.id,
                role: Roles.MANAGER,
            }

            // Add token to cookie
            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            // Assert
            expect(users).toHaveLength(1)
            expect(users[0].role).toBe(Roles.MANAGER)
        })

        it.todo('Should return 403 if non admin user tries to create a user')
    })
})
