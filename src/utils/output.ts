export function printKeyValue(label: string, value: string | undefined): void {
  if (!value) {
    return;
  }

  console.log(`${label}: ${value}`);
}

export function printList(title: string, items: string[]): void {
  console.log(`${title}:`);
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
