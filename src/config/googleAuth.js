const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile:', profile);
    
    // Check if user exists
    let user = await User.findByEmail(profile.emails[0].value);

    if (user) {
      console.log('Existing user found:', user.id);
      // Update user info
      user = await User.update(user.id, {
        name: profile.displayName,
        google_id: profile.id
      });
    } else {
      console.log('Creating new user');
      // Create new user without password field
      user = await User.create({
        email: profile.emails[0].value,
        name: profile.displayName,
        google_id: profile.id,
        role: 'host'
        // Don't include password field at all
      });
    }

    console.log('User processed successfully:', user.id);
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;