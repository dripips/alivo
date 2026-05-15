import React from "react";
import Card from "../../components/ui/Card";

const Home: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Good day!</h2>
    <Card>
      <p className="text-lg">Welcome to Alivo. Your daily summary will appear here.</p>
    </Card>
  </div>
);

export default Home;
