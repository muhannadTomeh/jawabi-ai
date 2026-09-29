export const PASSWORD_MIN_LENGTH = 8;

export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `يجب أن تتكون كلمة المرور من ${PASSWORD_MIN_LENGTH} أحرف على الأقل`;
  }
  if (!/\p{L}/u.test(password) || !/\d/u.test(password)) {
    return 'يجب أن تحتوي كلمة المرور على حرف واحد ورقم واحد على الأقل';
  }
  return null;
}
