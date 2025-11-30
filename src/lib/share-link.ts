// Generate a random 3-word combination for share links (like Twitch clips)
const adjectives = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Gray',
  'Big', 'Small', 'Fast', 'Slow', 'Hot', 'Cold', 'New', 'Old', 'Young', 'Smart',
  'Brave', 'Calm', 'Wild', 'Quiet', 'Loud', 'Bright', 'Dark', 'Sharp', 'Smooth', 'Rough',
  'Happy', 'Sad', 'Angry', 'Kind', 'Bold', 'Shy', 'Proud', 'Humble', 'Wise', 'Funny'
];

const nouns = [
  'Goat', 'Pie', 'Cat', 'Dog', 'Bird', 'Fish', 'Bear', 'Lion', 'Tiger', 'Wolf',
  'Moon', 'Star', 'Sun', 'Cloud', 'Rain', 'Snow', 'Wind', 'Fire', 'Water', 'Earth',
  'Tree', 'Flower', 'Leaf', 'Rock', 'Stone', 'Mountain', 'River', 'Ocean', 'Lake', 'Island',
  'Book', 'Pen', 'Key', 'Door', 'Window', 'Table', 'Chair', 'Lamp', 'Clock', 'Bell',
  'Apple', 'Banana', 'Orange', 'Grape', 'Berry', 'Peach', 'Pear', 'Cherry', 'Lemon', 'Lime'
];

const verbs = [
  'Jump', 'Run', 'Walk', 'Fly', 'Swim', 'Climb', 'Dance', 'Sing', 'Play', 'Read',
  'Write', 'Draw', 'Paint', 'Cook', 'Bake', 'Eat', 'Drink', 'Sleep', 'Wake', 'Dream',
  'Think', 'Learn', 'Teach', 'Help', 'Give', 'Take', 'Make', 'Build', 'Create', 'Fix',
  'Break', 'Fix', 'Open', 'Close', 'Push', 'Pull', 'Lift', 'Drop', 'Catch', 'Throw'
];

export function generateShareLink(): string {
  // Pick random words from each category
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  
  // Combine them (e.g., "RedGoatPie")
  return `${adjective}${noun}${verb}`;
}

export async function generateUniqueShareLink(checkExists: (link: string) => Promise<boolean>): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const link = generateShareLink();
    const exists = await checkExists(link);
    
    if (!exists) {
      return link;
    }
    
    attempts++;
  }
  
  // Fallback: add random number if we can't find unique combination
  return `${generateShareLink()}${Math.floor(Math.random() * 1000)}`;
}

