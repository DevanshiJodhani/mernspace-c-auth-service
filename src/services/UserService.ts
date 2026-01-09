import { Repository } from 'typeorm'
import bcrypt from 'bcryptjs'
import { User } from '../entity/User'
import { LimitedUserData, UserData, UserQueryParams } from '../types'
import createHttpError from 'http-errors'

export class UserService {
    findByEmail() {
        throw new Error('Method not implemented.')
    }
    constructor(private readonly userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password, role }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })

        if (user) {
            const error = createHttpError(400, 'Email is already exists!')
            throw error
        }

        // Hash the password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        return await this.userRepository.save({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
        })
    }

    async findByEmailWithPassword(email: string) {
        return await this.userRepository.findOne({
            where: {
                email,
            },
            select: [
                'id',
                'firstName',
                'lastName',
                'email',
                'password',
                'role',
            ],
        })
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id,
            },
            relations: {
                tenant: true,
            },
        })
    }

    async getAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.userRepository.createQueryBuilder('user')

        const result = await queryBuilder
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .getManyAndCount()
        return result
    }

    async update(
        userId: number,
        { firstName, lastName, role, email, tenantId }: LimitedUserData,
    ) {
        return await this.userRepository.save({
            firstName,
            lastName,
            role,
            email,
            tenant: tenantId ? { id: tenantId } : undefined,
        })
    }

    async deleteById(userId: number) {
        return await this.userRepository.delete(userId)
    }
}
