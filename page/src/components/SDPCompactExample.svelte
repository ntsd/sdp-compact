<script lang="ts">
  import * as sdpCompact from "sdp-compact";

  let offer: string = "";
  let compactedOffer = "";

  let isAudioChannel = true;
  let isVideoChannel = true;
  let isDataChannel = true;
  let compress = true;

  function compact() {
    const compacted = sdpCompact.compactSDP(offer, {
      compress,
    });
    compactedOffer = compacted;
  }

  async function generateOffer() {
    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    const options: RTCOfferOptions = {
      offerToReceiveAudio: isAudioChannel,
      offerToReceiveVideo: isVideoChannel,
    };

    if (isDataChannel) {
      connection.createDataChannel("data");
    }

    const offerDescription = await connection.createOffer(options);
    if (!offerDescription.sdp) {
      throw Error("can not create offer");
    }
    offer = offerDescription.sdp;

    compact();
  }

  const byteSize = (str: string) => new Blob([str]).size;
</script>

<h2 class="text-xl font-bold mt-8 mb-4">Online Test</h2>
<div class="grid grid-cols-2 xl:grid-cols-4 gap-2">
  <div>
    <label class="mb-2" for="audio">Audio Channel</label>
    <input type="checkbox" bind:checked={isAudioChannel} />
  </div>
  <div>
    <label class="mb-2" for="video">Video Channel</label>
    <input type="checkbox" bind:checked={isVideoChannel} />
  </div>
  <div>
    <label class="mb-2" for="video">Data Channel</label>
    <input type="checkbox" bind:checked={isDataChannel} />
  </div>
  <div>
    <label class="mb-2" for="video">Compress</label>
    <input type="checkbox" bind:checked={compress} />
  </div>
</div>
<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-8 mb-4"
  on:click={generateOffer}
>
  Generate SDP
</button>

<div class="mt-4">
  <h3 class="font-bold mb-2">
    Raw SDP ({byteSize(offer)} bytes)
  </h3>
  <textarea
    class="p-2 scrollable ring resize-none min-w-full"
    bind:value={offer}
    on:input={compact}
    rows="10"
  ></textarea>
</div>
<div class="mt-4">
  <h3 class="font-bold mb-2">
    Compacted SDP ({byteSize(compactedOffer)} bytes)
  </h3>
  <pre class="bg-gray-200 p-2 scrollable">{compactedOffer}</pre>
</div>

<style>
  .scrollable {
    max-height: 50vh;
    overflow-y: auto;
  }
</style>