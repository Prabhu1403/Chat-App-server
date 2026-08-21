import User from './user';
import Group from './creategroup';
import GroupMembers from './groupmembers';
import GroupMessage from './groupmessage';
import MessageRead from './messageread';
import Message from './message';
import Conversation from './conversation';
import ConversationMembers from './conversation_members';

// A Group can have many Users
Group.belongsToMany(User, {
    through: GroupMembers,
    foreignKey: 'groupId',
    otherKey: 'userId',
    targetKey: 'userId',
    as: 'members'
});

// A User can belong to many Groups
User.belongsToMany(Group, {
    through: GroupMembers,
    foreignKey: 'userId',
    sourceKey: 'userId',
    otherKey: 'groupId',
    as: 'groups'
});

GroupMembers.belongsTo(User, {
   foreignKey: "userId",
   targetKey: "userId"
});

GroupMembers.belongsTo(Group, {
   foreignKey: "groupId"
});

GroupMessage.hasMany(MessageRead, {
    foreignKey: 'messageId',
    as: 'reads'
});

MessageRead.belongsTo(GroupMessage, {
    foreignKey: 'messageId'
});

User.hasMany(MessageRead, {
    foreignKey: 'userId',
    as: 'groupMessageReads'
});

MessageRead.belongsTo(User, {
    foreignKey: 'userId'
});

// Conversation Associations
Conversation.hasMany(ConversationMembers, {
    foreignKey: 'conversation_id',
    as: 'members'
});

ConversationMembers.belongsTo(Conversation, {
    foreignKey: 'conversation_id'
});

Conversation.hasMany(Message, {
    foreignKey: 'conversation_id',
    as: 'messages'
});

Message.belongsTo(Conversation, {
    foreignKey: 'conversation_id'
});

User.hasMany(ConversationMembers, {
    foreignKey: 'user_id',
    sourceKey: 'userId', // User model has `userId` as the string custom ID
    as: 'conversation_memberships'
});

ConversationMembers.belongsTo(User, {
    foreignKey: 'user_id',
    targetKey: 'userId'
});

export { User, Group, GroupMembers, GroupMessage, MessageRead, Conversation, ConversationMembers };
            