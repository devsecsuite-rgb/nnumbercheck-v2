export const onRequestGet = async () => {
  return new Response(JSON.stringify({ message: "Hello from Pages Functions" }), {
    headers: { "Content-Type": "application/json" },
  });
};
