export const parsedToInt = (storeId: string) => parseInt(storeId as string, 10);

export const getShortName = (name: string) => {
  const words = name.split(" ").filter(Boolean); // Remove extra spaces
  if (words.length === 1) return words[0][0].toUpperCase(); // Single name case
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const getRandomUserAvatar = () => {
  const colors = ["bg-primary", "bg-warning", "bg-info"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return color;
};
