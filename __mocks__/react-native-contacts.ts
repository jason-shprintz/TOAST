const Contacts = {
  checkPermission: jest.fn().mockResolvedValue('authorized'),
  requestPermission: jest.fn().mockResolvedValue('authorized'),
  getAll: jest.fn().mockResolvedValue([]),
  getContactsMatchingString: jest.fn().mockResolvedValue([]),
};

export default Contacts;
