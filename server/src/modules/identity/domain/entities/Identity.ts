export type AccountStatus =
    | 'REGISTERED'
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'DEACTIVATED';

export type VerificationStatus =
    | 'UNVERIFIED'
    | 'IN_PROGRESS'
    | 'VERIFIED'
    | 'REJECTED'
    | 'EXPIRED';

export type IdentityProps = {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    accountStatus: AccountStatus;
    verificationStatus: VerificationStatus;
    trustScore: number | null;
    riskScore: number | null;
    riskRating: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export class Identity {
    private constructor(private readonly props: IdentityProps) { }

    static register(props: {
        id: string;
        email?: string | null;
        phoneNumber?: string | null;
        now?: Date;
    }): Identity {
        if (!props.email && !props.phoneNumber) {
            throw new Error('Identity requires an email or phone number');
        }

        const now = props.now ?? new Date();
        return new Identity({
            id: props.id,
            email: props.email ?? null,
            phoneNumber: props.phoneNumber ?? null,
            accountStatus: 'REGISTERED',
            verificationStatus: 'UNVERIFIED',
            trustScore: null,
            riskScore: null,
            riskRating: null,
            createdAt: now,
            updatedAt: now,
        });
    }

    static reconstitute(props: IdentityProps): Identity {
        return new Identity({ ...props });
    }

    get id(): string {
        return this.props.id;
    }

    get email(): string | null {
        return this.props.email;
    }

    get phoneNumber(): string | null {
        return this.props.phoneNumber;
    }

    get accountStatus(): AccountStatus {
        return this.props.accountStatus;
    }

    get verificationStatus(): VerificationStatus {
        return this.props.verificationStatus;
    }

    get snapshot(): IdentityProps {
        return { ...this.props };
    }

    verify(): void {
        if (this.props.verificationStatus === 'VERIFIED') {
            return;
        }

        if (this.props.accountStatus === 'DEACTIVATED') {
            throw new Error('Deactivated identities cannot be verified');
        }

        if (this.props.verificationStatus === 'REJECTED') {
            throw new Error('Rejected identities cannot be verified');
        }

        this.props.verificationStatus = 'VERIFIED';
        this.props.updatedAt = new Date();
    }
}
