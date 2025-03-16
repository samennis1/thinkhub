import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/homepage");
  }

  return (
    <HydrateClient>
      <main
        className="flex min-h-screen flex-col items-center justify-center p-8"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Cdefs%3E%3Crect stroke='%23ffffff' stroke-width='.5' width='1' height='1' id='s'/%3E%3Cpattern id='a' width='3' height='3' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cuse fill='%23fcfcfc' href='%23s' y='2'/%3E%3Cuse fill='%23fcfcfc' href='%23s' x='1' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s' x='2' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='2'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='1' y='1'/%3E%3C/pattern%3E%3Cpattern id='b' width='7' height='11' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f5f5f5'%3E%3Cuse href='%23s'/%3E%3Cuse href='%23s' y='5' /%3E%3Cuse href='%23s' x='1' y='10'/%3E%3Cuse href='%23s' x='2' y='1'/%3E%3Cuse href='%23s' x='2' y='4'/%3E%3Cuse href='%23s' x='3' y='8'/%3E%3Cuse href='%23s' x='4' y='3'/%3E%3Cuse href='%23s' x='4' y='7'/%3E%3Cuse href='%23s' x='5' y='2'/%3E%3Cuse href='%23s' x='5' y='6'/%3E%3Cuse href='%23s' x='6' y='9'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23b)' width='100%25' height='100%25'/%3E%3C/svg%3E\")",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
        }}
      >
        <section className="max-w-2xl rounded-lg bg-gray-900 bg-opacity-90 p-8 text-center shadow-lg">
          <h2 className="mb-4 text-4xl font-extrabold text-white">
            Welcome to ThinkHub
          </h2>
          <p className="mb-6 text-lg text-gray-300">
            ThinkHub is a project management tool designed for research teams,
            policy analysts, and innovative thinkers.
            <br></br>
            Organise your projects, collaborate on research, and streamline task
            management all in one place.
          </p>

          <Link
            href="/api/auth/signin?callbackUrl=/homepage"
            className="rounded-md bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow hover:bg-green-700"
          >
            Sign In to Get Started
          </Link>
        </section>

        <footer className="absolute bottom-4 text-sm text-gray-500">
          © {new Date().getFullYear()} ThinkHub. All rights reserved.
        </footer>
      </main>
    </HydrateClient>
  );
}
