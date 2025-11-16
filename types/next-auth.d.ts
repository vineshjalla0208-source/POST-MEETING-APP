import "next-auth"

declare module "next-auth" {
  interface User {
    id?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    email?: string | null
    name?: string | null
    picture?: string | null
    provider?: string
    providerAccountId?: string
  }
}

