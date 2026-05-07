import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user?.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          return null
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyStatus: user.companyStatus,
        } as {
          id: string
          email: string
          name: string
          role: string
          companyStatus: string
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = (user as { role?: string }).role
        token.companyStatus = (user as { companyStatus?: string }).companyStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string; role?: string; companyStatus?: string }).id =
          token.sub
        ;(session.user as { id?: string; role?: string; companyStatus?: string }).role =
          token.role as string
        ;(session.user as { id?: string; role?: string; companyStatus?: string }).companyStatus =
          token.companyStatus as string
      }
      return session
    },
  },
}
