import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register', () => {
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
        it('Should return the 201 status code', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(201)
        })

        it('Should return valid json response', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert  applcation/json utf-8
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('Should persist the user in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        // My Code Logic for this id test case.
        it('Should return an id of the created user', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.body).toHaveProperty('id')
        })

        // Sir solution code for this id test case.
        // it('should return an id of the created user', async () => {
        //     // Arrange
        //     const userData = {
        //         firstName: 'Rakesh',
        //         lastName: 'K',
        //         email: 'rakesh@mern.space',
        //         password: 'password',
        //     }
        //     // Act
        //     const response = await request(app)
        //         .post('/auth/register')
        //         .send(userData)

        //     // Assert
        //     expect(response.body).toHaveProperty('id')
        //     const repository = connection.getRepository(User)
        //     const users = await repository.find()
        //     expect((response.body as Record<string, string>).id).toBe(
        //         users[0].id,
        //     )
        // })

        it('Should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('Should store the hashed password in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('Should return 400 status code if email is already exists', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            // Assert
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('Should return the access token and refresh token inside a cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            interface Headers {
                ['set-cookie']: string[]
            }
            // Assert
            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || []

            let accessToken: string | null = null
            let refreshToken: string | null = null

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
        })

        it('Should store refresh token in the datbase', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken)

            // const refreshTokens = await refreshTokenRepo.find()
            // expect(refreshTokens).toHaveLength(1)

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('Fields are missing', () => {
        it('Should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: '',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if firstName is missing', async () => {
            // Arrange
            const userData = {
                firstName: '',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if lastName is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: '',
                email: 'devanshi@mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('Should return 400 status code if password is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: '',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })
    })

    describe('Fields are not in proper format', () => {
        it('Should trim the email field', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: ' devanshijodhani45@gmail.com ',
                password: 'secret045',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]

            expect(user.email).toBe('devanshijodhani45@gmail.com')
        })

        it('Should return 400 status code if email is not a valid email', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi_mern.space',
                password: 'secret045',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('Shoud retrn 400 status code if password length is less than 8 chars', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: 'devanshi@mern.space',
                password: 'secret',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it('Shoud return an array of error messages if email is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Devanshi',
                lastName: 'Jodhani',
                email: '',
                password: 'secret',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(400)
            const responseBody = response.body as { errors: string[] }
            expect(Array.isArray(responseBody.errors)).toBe(true)
            expect(responseBody.errors.length).toBeGreaterThan(0)
        })
    })
})
