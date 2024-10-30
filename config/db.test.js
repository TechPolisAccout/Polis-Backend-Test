const mongoose = require('mongoose');
const connectDB = require('./db');
const logger = connectDB.logger;

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

jest.mock('pino', () => {
  return jest.fn(() => ({
    info: jest.fn(),
  }));
});

describe('Database connection tests', () => {
  // Set up mock before all tests
  beforeAll(() => {
    mongoose.connect.mockReset();
  });

  // Clean up mock after all tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Connection Tests', () => {
    beforeAll(() => {
      // Set up the mongoose.connect to resolve a fake connection object
      mongoose.connect.mockResolvedValue({ connection: { host: 'localhost' } });
    });

    it('should connect to the database successfully', async () => {
      await connectDB();

      // Check that mongoose.connect was called
      expect(mongoose.connect).toHaveBeenCalled();
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    });

    it('should log successful connection message', async () => {
      // Spy on the Pino logger's info method
      const loggerInfoSpy = jest.spyOn(logger, 'info');

      await connectDB();

      // Check that the logger.info method was called with the expected message
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('MongoDB Connected: localhost'));

      // Restore the spy
      loggerInfoSpy.mockRestore();
    });
  });

  describe('Connection Error Tests', () => {
    beforeAll(() => {
      // Set up the mongoose.connect to reject with an error
      const errorMessage = 'Database connection failed';
      mongoose.connect.mockRejectedValue(new Error(errorMessage));
    });

    it('should handle a connection error', async () => {
      const errorMessage = 'Database connection failed';

      await expect(connectDB()).rejects.toThrow(errorMessage);

      // Check that mongoose.connect was called
      expect(mongoose.connect).toHaveBeenCalled();
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    });
  });
});
