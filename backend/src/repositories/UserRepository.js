import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { USER_ROLES } from '../config/constants.js';

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId) {
    return await User.findById(userId);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  /**
   * Create new user
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Update user
   */
  async update(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async delete(userId) {
    return await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
  }

  /**
   * Hard delete user
   */
  async hardDelete(userId) {
    return await User.findByIdAndDelete(userId);
  }

  /**
   * Get all users with pagination and filtering
   */
  async findAll({ page = 1, limit = 10, role = null, isActive = null } = {}) {
    const query = {};

    if (role) query.role = role;
    if (isActive !== null) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get user with role-specific data
   */
  async findByIdWithRoleData(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    let roleData = null;
    if (user.role === USER_ROLES.STUDENT) {
      roleData = await Student.findOne({ userId });
    } else if (user.role === USER_ROLES.TEACHER) {
      roleData = await Teacher.findOne({ userId });
    }

    return { user, roleData };
  }

  /**
   * Count users by role
   */
  async countByRole(role) {
    return await User.countDocuments({ role });
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm, { page = 1, limit = 10 } = {}) {
    const regex = new RegExp(searchTerm, 'i');
    const query = {
      $or: [{ name: regex }, { email: regex }],
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return { users, total, page, limit };
  }
}

export default new UserRepository();
