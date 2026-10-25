export class Player {
  constructor(socketId, name, avatar, isHost = false) {
    this.id = socketId;
    this.name = name || 'Anonymous';
    this.avatar = avatar || 'default';
    this.score = 0;
    this.isHost = isHost;
    this.hasGuessed = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      isHost: this.isHost,
      hasGuessed: this.hasGuessed,
    };
  }
}