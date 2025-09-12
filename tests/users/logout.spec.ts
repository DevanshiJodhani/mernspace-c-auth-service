import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import { isJwt } from '../utils'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { RefreshToken } from '../../src/entity/RefreshToken'

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
        it('should clear the accessToken and refreshToken cookies and delete refresh token from DB', async () => {
            // Arrange: create user
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // Act: login to get cookies
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({ email: user.email, password: userData.password })

            interface Headers {
                ['set-cookie']: string[]
            }

            let accessToken: string | null = null
            let refreshToken: string | null = null

            const cookies =
                (loginResponse.headers as unknown as Headers)['set-cookie'] ||
                []
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()
            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()

            // Act: logout
            const logoutResponse = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ])
                .send()

            // Assert: cookies exist and response is 200
            const setCookies = logoutResponse.headers['set-cookie']
            const cookiesArray = Array.isArray(setCookies)
                ? setCookies
                : [setCookies]

            expect(
                cookiesArray.some((c: string) => c.startsWith('accessToken=')),
            ).toBeTruthy()
            expect(
                cookiesArray.some((c: string) => c.startsWith('refreshToken=')),
            ).toBeTruthy()

            // Assert: refresh token deleted from DB
            const refreshTokenRepo = connection.getRepository(RefreshToken)
            const tokenInDb = await refreshTokenRepo.findOne({
                where: { user: { id: user.id } },
            })
            expect(tokenInDb).toBeNull()
        })

        it('should return 401 if accessToken cookie is missing', async () => {
            const response = await request(app).post('/auth/logout').send()

            expect(response.status).toBe(401)
        })
    })
})
