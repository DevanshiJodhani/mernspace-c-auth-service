import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import { isJwt } from '../utils'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

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

    describe('With valid refresh token', () => {
        it('Should return a new access token', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // Login to get refresh token
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password })

            interface Headers {
                ['set-cookie']: string[]
            }

            const cookies =
                (loginResponse.headers as unknown as Headers)['set-cookie'] ||
                []
            let refreshToken: string | null = null

            cookies.forEach((cookie) => {
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(refreshToken).not.toBeNull()

            // Act: call refresh endpoint
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .send()

            // Assert
            const newCookies =
                (response.headers as unknown as Headers)['set-cookie'] || []
            let newAccessToken: string | null = null
            let newRefreshToken: string | null = null

            newCookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    newAccessToken = cookie.split(';')[0].split('=')[1]
                }
                if (cookie.startsWith('refreshToken=')) {
                    newRefreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(newAccessToken).not.toBeNull()
            expect(newRefreshToken).not.toBeNull()
            expect(isJwt(newAccessToken)).toBeTruthy()
            expect(isJwt(newRefreshToken)).toBeTruthy()
        })

        it('should return 401 if refresh token is missing', async () => {
            const response = await request(app).post('/auth/refresh').send()

            expect(response.statusCode).toBe(401)
        })

        it('should return 401 if refresh token is invalid', async () => {
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', ['refreshToken=invalidtoken'])
                .send()

            expect(response.statusCode).toBe(401)
        })
    })
})
