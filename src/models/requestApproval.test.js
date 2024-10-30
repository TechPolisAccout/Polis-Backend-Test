const Approval = require('./requestApproval');

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');

  const mockApprovalModel = function (doc) {
    this.booking = doc.booking;
    this.user = doc.user;
    this.message = doc.message;
    this.status = doc.status || 'pending';
    this.save = jest.fn().mockResolvedValue(this);
  };

  mockApprovalModel.create = jest.fn();
  mockApprovalModel.findById = jest.fn();

  return {
    ...actualMongoose,
    model: jest.fn(() => mockApprovalModel),
  };
});

describe('Approval Schema', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new approval document', async () => {
    const mockCreate = Approval.create.mockResolvedValue({
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
      status: 'pending',
    });

    const approvalData = {
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
      status: 'pending',
    };

    const newApproval = await Approval.create(approvalData);

    expect(mockCreate).toHaveBeenCalledWith(approvalData);
    expect(newApproval).toEqual({
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
      status: 'pending',
    });
  });

  test('should find an approval by id', async () => {
    const mockFindById = Approval.findById.mockResolvedValue({
      _id: 'approval-id',
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
      status: 'approved',
    });

    const approval = await Approval.findById('approval-id');

    expect(mockFindById).toHaveBeenCalledWith('approval-id');
    expect(approval).toEqual({
      _id: 'approval-id',
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
      status: 'approved',
    });
  });

  test('should save an approval document', async () => {
    const approvalInstance = new Approval({
      booking: 'some-booking-id',
      user: 'some-user-id',
      message: 'This is a test message',
    });

    const savedApproval = await approvalInstance.save();

    expect(approvalInstance.save).toHaveBeenCalled();
    expect(savedApproval).toEqual(approvalInstance);
  });
});
