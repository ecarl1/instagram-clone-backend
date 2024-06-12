const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../src/utils/generateToken");

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("Token Generation", () => {
  const user = {
    username: "testuser",
    role: "user",
    _id: "1234567890",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should generate an access token with correct payload and expiration", () => {
    const mockToken = "mockAccessToken";
    jwt.sign.mockReturnValue(mockToken);

    const token = generateAccessToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      { username: user.username, role: user.role, _id: user._id },
      "mySecretKeyfromenv",
      { expiresIn: "2s" }
    );
    expect(token).toBe(mockToken);
  });

  test("should generate a refresh token with correct payload", () => {
    const mockToken = "mockRefreshToken";
    jwt.sign.mockReturnValue(mockToken);

    const token = generateRefreshToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      { username: user.username, role: user.role, _id: user._id },
      "myRefreshSecretKeyfromenv"
    );
    expect(token).toBe(mockToken);
  });
});
