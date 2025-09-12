import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'

describe('POST /auth/login', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given a logged-in user', () => {
        it('should return 401 if accessToken cookie is missing', async () => {
            const response = await request(app).post('/auth/logout').send()

            expect(response.status).toBe(401)
        })
    })
})
