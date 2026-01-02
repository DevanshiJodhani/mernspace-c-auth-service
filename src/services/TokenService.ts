import { sign, JwtPayload } from 'jsonwebtoken'
import { Config } from '../config'
import { User } from '../entity/User'
import { RefreshToken } from '../entity/RefreshToken'
import { Repository } from 'typeorm'
import createHttpError from 'http-errors'

export class TokenService {
    constructor(
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    generateAccessToken(payload: JwtPayload) {
        if (!Config.PRIVATE_KEY) {
            const error = createHttpError(500, 'SECRET_KEY is not set.')
            throw error
        }

        const privateKey = Config.PRIVATE_KEY

        const accessToken = sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'auth-service',
        })

        return accessToken

        // **** This is for when you run localally test case*****

        // const privateKeyPath = path.join(__dirname, '../../certs/private.pem')

        // const privateKey = fs.readFileSync(privateKeyPath, 'utf8')

        // const accessToken = sign(payload, privateKey, {
        //     algorithm: 'RS256',
        //     expiresIn: '1h',
        //     issuer: 'auth-service',
        // })

        // return accessToken
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(payload.id),
        })

        return refreshToken
    }

    async persistRefreshToken(user: User) {
        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365 // 1Y -> (Leap year not counted)

        const newRefreshToken = await this.refreshTokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_YEAR),
        })

        return newRefreshToken
    }

    async deleteRefreshToken(tokenId: number) {
        return await this.refreshTokenRepository.delete({ id: tokenId })
    }
}
