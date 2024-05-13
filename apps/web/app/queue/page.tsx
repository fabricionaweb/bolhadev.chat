"use client";

import { useRef, ReactElement, useEffect, useState, useCallback } from "react";
import { socket } from "../../lib/socket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useUserMedia } from "@/hooks/useUserMedia";
import { Header } from "@/components/header";

let _socket: Socket;

export default function Page(): JSX.Element {
  const router = useRouter();

  const videoRef = useRef<ReactElement<HTMLVideoElement>>(null);

  const {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    setSelectedAudioDevice,
    selectedVideoDevice,
    setSelectedVideoDevice,
  } = useUserMedia(videoRef.current);

  const [usersOnline, setUsersOnline] = useState(null);
  const [inQueue, setInQueue] = useState(false);

  useEffect(() => {
    if (_socket == null) {
      _socket = socket();
    }

    _socket.on("connect", () => {
      _socket.emit("userConnect", {
        id: _socket.id,
      });
    });

    _socket.on("newUserConnect", ({ size }) => {
      setUsersOnline(size);
    });

    _socket.on("roomFound", ({ room, roomId }) => {
      console.log({ room, roomId });
      router.push(`room/${roomId}`);
    });

    return () => {
      _socket.off("queueUpdated");
      _socket.off("newUserConnect");
      _socket.off("roomFound");
      _socket.close();
    };
  }, []);

  const onConnect = useCallback(() => {
    setInQueue(!inQueue);
    _socket.emit(inQueue ? "queueExit" : "queueJoin", { id: _socket.id });
  }, [inQueue]);

  return (
    <main className="flex flex-col h-full">
      <Header />
      <section className="flex h-full place-content-center justify-center content-center align-center">
        <div>
          <h1>Estamos procurando alguém para praticar inglês contigo</h1>
          <h1>QueueSize: {usersOnline}</h1>
          <video
            className="[transform:rotateY(180deg)] w-96 h-96"
            ref={videoRef}
            playsInline
            autoPlay={true}
            muted={true}
          ></video>
          <h2>Confira sue microfone e webcam, enquanto aguarda</h2>
          <div className="flex flex-row gap-6 w-full">
            <Select
              onValueChange={setSelectedAudioDevice}
              value={selectedAudioDevice}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Audio" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((audio) => {
                  return (
                    <SelectItem key={audio.deviceId} value={audio.deviceId}>
                      {audio.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select
              onValueChange={setSelectedVideoDevice}
              value={selectedVideoDevice}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Video" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((video) => {
                  return (
                    <SelectItem key={video.deviceId} value={video.deviceId}>
                      {video.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <h2>
            {inQueue
              ? "Procurando outro usuário"
              : "Quando você estiver pronto entre em uma sala"}
          </h2>
          <Button onClick={onConnect}>
            {inQueue ? "Cancelar" : "Entrar em uma sala"}
          </Button>
        </div>
      </section>
    </main>
  );
}
