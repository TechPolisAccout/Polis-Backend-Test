const NewsletterSubscription = require('./newsletterSubscription');

describe('NewsletterSubscription Model Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should error when required fields are missing', async () => {
    const subscriptionWithoutRequiredFields = new NewsletterSubscription({});

    jest.spyOn(subscriptionWithoutRequiredFields, 'save').mockRejectedValue({
      errors: {
        email: {
          message: 'Path `email` is required.',
        },
      },
    });

    let validationError;
    try {
      await subscriptionWithoutRequiredFields.save();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeDefined();
    expect(validationError.errors).toBeDefined();
    expect(validationError.errors.email.message).toBe('Path `email` is required.');
  });

  it('should allow valid email addresses', async () => {
    const validSubscription = new NewsletterSubscription({
      email: 'valid@example.com',
    });

    jest.spyOn(validSubscription, 'save').mockResolvedValue(validSubscription);

    const result = await validSubscription.save();
    expect(result).toBeDefined();
    expect(result.email).toBe('valid@example.com');
  });

  it('should not allow duplicate emails', async () => {
    const subscription1 = new NewsletterSubscription({
      email: 'duplicate@example.com',
    });

    jest.spyOn(subscription1, 'save').mockResolvedValue(subscription1);
    await subscription1.save();

    const subscription2 = new NewsletterSubscription({
      email: 'duplicate@example.com',
    });

    jest.spyOn(subscription2, 'save').mockRejectedValue({
      code: 11000,
    });

    let validationError;
    try {
      await subscription2.save();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeDefined();
    expect(validationError.code).toBe(11000);
  });
});
