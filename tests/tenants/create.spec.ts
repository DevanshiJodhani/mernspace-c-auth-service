import { DataSource } from 'typeorm'
import request from 'supertest'
import app from '../../src/app'
import { AppDataSource } from '../../src/config/data-source'

describe('POST /tenants', () => {
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

    describe('Given all fields', () => {
        it('Should return 201 status code', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            }

            const response = await request(app)
                .post('/tenants')
                .send(tenantData)

            expect(response.statusCode)
        })
    })
})
