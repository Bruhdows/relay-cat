import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB();
      
      const existingUser = await User.findOne({ discordId: profile.id });
      
      if (!existingUser) {
        await User.create({
          discordId: profile.id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar
        });
      }
      
      return true;
    },
    async session({ session, token }) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      
      if (user) {
        session.user.id = user._id.toString();
        session.user.discordId = user.discordId;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
