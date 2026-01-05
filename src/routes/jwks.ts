import { Router } from 'express'
import pemToJwk from 'pem-jwk'
import { Config } from '../config'

const router = Router()

router.get('/.well-known/jwks.json', (_req, res) => {
    //   THIS BLOCK IS FOR CI / GITHUB PIPELINE

    if (!Config.JWT_PUBLIC_KEY) {
        return res.status(500).json({
            error: 'JWT_PUBLIC_KEY is not set',
        })
    }

    const jwk = pemToJwk.pem2jwk(Config.JWT_PUBLIC_KEY)

    return res.json({
        keys: [
            {
                ...jwk,
                use: 'sig',
                alg: 'RS256',
                kid: 'auth-key-1',
            },
        ],
    })

    // *********** THIS BLOCK IS FOR LOCAL DEVELOPMENT ***************

    // const publicKeyPath = path.join(__dirname, '../../certs/public.pem')
    // const publicKey = fs.readFileSync(publicKeyPath, 'utf8')

    // const jwk = pemToJwk.pem2jwk(publicKey)

    // res.json({
    //     keys: [
    //         {
    //             ...jwk,
    //             use: 'sig',
    //             alg: 'RS256',
    //             kid: 'auth-key-1',
    //         },
    //     ],
    // })
})

export default router
