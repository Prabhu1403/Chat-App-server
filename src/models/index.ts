import { sequelize } from '../config/db';
import User from './user';
import Group from './creategroup';
import GroupMembers from './groupmembers';
import GroupMessage from './groupmessage';
import MessageRead from './messageread';
import Message from './message';
import JoinRequest from './joinrequest';
import Conversation from './conversation';
import ConversationMembers from './conversation_members';
import './associations';

const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true });
        await Message.sync({ alter: true });
        console.log('Message model synchronized successfully.');
        await User.sync({ alter: true });
        console.log('User model synchronized successfully.');
        await Group.sync({ alter: true });
        console.log('Group model synchronized successfully.');
        await GroupMembers.sync({ alter: true });
        console.log('GroupMembers model synchronized successfully.');
        await GroupMessage.sync({ alter: true });
        console.log('GroupMessage model synchronized successfully.');
        await MessageRead.sync({ alter: true });
        console.log('MessageRead model synchronized successfully.');
        await JoinRequest.sync({ alter: true });
        console.log('JoinRequest model synchronized successfully.');
        await Conversation.sync({ alter: true });
        console.log('Conversation model synchronized successfully.');
        await ConversationMembers.sync({ alter: true });
        console.log('ConversationMembers model synchronized successfully.');
        console.log('All models synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing models:', error);
    }
};

export {
    sequelize,
    User,
    Group,
    GroupMembers,
    GroupMessage,
    MessageRead,
    Message,
    JoinRequest,
    Conversation,
    ConversationMembers,
    syncModels
};
