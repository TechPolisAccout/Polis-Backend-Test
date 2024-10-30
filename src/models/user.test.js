const bcrypt = require('bcryptjs');
const userSchema = require('./user');

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('User Model Tests', () => {
  beforeEach(() => {
    bcrypt.genSalt.mockClear();
    bcrypt.hash.mockClear();
    bcrypt.compare.mockClear();

    bcrypt.genSalt.mockResolvedValue('test-salt');
    bcrypt.hash.mockResolvedValue('hashed-password');
  });

  it('should hash the password correctly', async () => {
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
    expect(hashedPassword).toBe('hashed-password');
  });

  it('should compare a provided password with the hashed password correctly', async () => {
    const password = 'password123';
    const hashedPassword = 'hashed-password';

    bcrypt.compare.mockResolvedValue(true);

    const isMatch = await bcrypt.compare(password, hashedPassword);

    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should error when no email is provided', () => {
    const userWithInvalidEmail = userSchema({
      password: 'password123',
    });

    const validationError = userWithInvalidEmail.validateSync();

    expect(validationError.errors['email']).toBeDefined();
    expect(validationError.errors['email'].message).toBe('Please provide an email address');
  });

  it('should error for invalid email format', () => {
    const userWithInvalidEmail = userSchema({
      email: 'invalidemail',
      password: 'password123',
    });

    const validationError = userWithInvalidEmail.validateSync();

    expect(validationError.errors['email']).toBeDefined();
    expect(validationError.errors['email'].message).toBe('Please provide a valid email address');
  });

  it('should error for invalid password format', () => {
    const userWithWeakPassword = userSchema({
      email: 'test@example.com',
      password: 'password',
    });

    const validationError = userWithWeakPassword.validateSync();

    expect(validationError.errors['password']).toBeDefined();
    expect(validationError.errors['password'].message).toBe(
      'Password must contain at least one lowercase character, one uppercase character, and one number, symbol, or whitespace character',
    );
  });

  it('should error if password is less than 8 characters', () => {
    const userWithShortPassword = userSchema({
      email: 'test@example.com',
      password: 'Short1',
    });

    const validationError = userWithShortPassword.validateSync();

    expect(validationError.errors['password']).toBeDefined();
    expect(validationError.errors['password'].message).toBe('Password must be at least 8 characters long');
  });

  it('should allow valid roles (agent, admin)', () => {
    const userWithValidRole = userSchema({
      email: 'validrole@example.com',
      password: 'Validpass1!',
      role: 'admin',
    });

    const validationError = userWithValidRole.validateSync();

    expect(validationError).toBeUndefined();
  });

  it('should error for invalid role', () => {
    const userWithInvalidRole = userSchema({
      email: 'invalidrole@example.com',
      password: 'Validpass1!',
      role: 'invalidRole',
    });

    const validationError = userWithInvalidRole.validateSync();

    expect(validationError.errors['role']).toBeDefined();
    expect(validationError.errors['role'].message).toBe('`invalidRole` is not a valid enum value for path `role`.');
  });

  it('should allow valid genders (Male, Female)', () => {
    const userWithValidGender = userSchema({
      email: 'validgender@example.com',
      password: 'Validpass1!',
      gender: 'Male',
    });

    const validationError = userWithValidGender.validateSync();

    expect(validationError).toBeUndefined();
  });

  it('should error for invalid gender', () => {
    const userWithInvalidGender = userSchema({
      email: 'invalidgender@example.com',
      password: 'Validpass1!',
      gender: 'Unknown',
    });

    const validationError = userWithInvalidGender.validateSync();

    expect(validationError.errors['gender']).toBeDefined();
    expect(validationError.errors['gender'].message).toBe('`Unknown` is not a valid enum value for path `gender`.');
  });

  it('should set verified to false by default', () => {
    const newUser = new userSchema({
      email: 'test@example.com',
      password: 'Validpass1!',
    });

    expect(newUser.verified).toBe(false);
  });

  it('should set default dateAdded when adding to wishlist', () => {
    const userWithWishlist = new userSchema({
      email: 'wishlistuser@example.com',
      password: 'Validpass1!',
      wishlist: [{ property: '507f1f77bcf86cd799439011' }],
    });

    expect(userWithWishlist.wishlist[0].dateAdded).toBeDefined();
  });
});
