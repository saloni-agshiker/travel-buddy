import { useState } from "react";
import { MessageCircle, Send, Search, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";


const mockConversations = [
  {
    id: "1",
    name: "Sarah Chen",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    lastMessage: "That sounds great! I'm so excited for Bali",
    lastMessageTime: "2m ago",
    unreadCount: 2,
    online: true
  },
  {
    id: "2",
    name: "Marcus Johnson",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    lastMessage: "What time should we meet at the airport?",
    lastMessageTime: "1h ago",
    unreadCount: 0,
    online: true
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    lastMessage: "I found a great ramen place in Tokyo!",
    lastMessageTime: "3h ago",
    unreadCount: 1,
    online: false
  },
  {
    id: "4",
    name: "Ahmed Hassan",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    lastMessage: "Thanks for the safari tips!",
    lastMessageTime: "1d ago",
    unreadCount: 0,
    online: false
  }
];

export function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    mockConversations[0]
  );
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: "1",
      text: "Hey! I saw you're also going to Bali in January!",
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false
    },
    {
      id: "2",
      senderId: "current",
      text: "Yes! I'm so excited! Have you been there before?",
      timestamp: new Date(Date.now() - 3500000),
      isCurrentUser: true
    },
    {
      id: "3",
      senderId: "1",
      text: "This will be my first time! I'm planning to do lots of surfing and yoga. What about you?",
      timestamp: new Date(Date.now() - 3400000),
      isCurrentUser: false
    },
    {
      id: "4",
      senderId: "current",
      text: "Same here! Maybe we could meet up and explore together?",
      timestamp: new Date(Date.now() - 3300000),
      isCurrentUser: true
    },
    {
      id: "5",
      senderId: "1",
      text: "That sounds great! I'm so excited for Bali",
      timestamp: new Date(Date.now() - 120000),
      isCurrentUser: false
    }
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: "current",
      text: messageText,
      timestamp: new Date(),
      isCurrentUser: true
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h2 className="text-3xl mb-2">Messages</h2>
        <p className="text-muted-foreground">Chat with your travel connections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-teal-50 border-l-4 border-teal-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conversation.image} alt={conversation.name} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{conversation.name}</h4>
                        <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2 bg-teal-500 text-white">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={selectedConversation.image} alt={selectedConversation.name} />
                        <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedConversation.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.isCurrentUser
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isCurrentUser ? "text-teal-100" : "text-muted-foreground"
                        }`}
                      >
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} className="bg-teal-500 hover:bg-teal-600">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
