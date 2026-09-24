import { compact, compactSDP, compactSDPBytes } from "../src/compact";
import { decompact, decompactSDP, decompactSDPBytes } from "../src/decompact";
import { Options } from "../src/options";
import { uint8ArrayToBase92, base92ToUint8Array } from "../src/base92";
import * as sdpTransform from "sdp-transform";
import { deflateSync, strToU8 } from "fflate";

const offer: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 57834 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 115.87.239.220\r\na=candidate:518347658 1 udp 2113937151 7f4682cc-8fa4-4ee1-adea-96297fff965b.local 57834 typ host generation 0 network-cost 999\r\na=candidate:2916800044 1 udp 2113939711 343bd573-42c8-43b6-ac21-8bc284e113f1.local 57835 typ host generation 0 network-cost 999\r\na=candidate:1905640790 1 udp 1677729535 115.87.239.220 57834 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999\r\na=candidate:793446246 1 udp 1677732095 2001:fb1:a9:f8f6:9859:2fb8:7405:7f4f 57835 typ srflx raddr :: rport 0 generation 0 network-cost 999\r\na=ice-ufrag:OQ5n\r\na=ice-pwd:9Xzfi/ysufyZdZ6OvHA5ld13\r\na=ice-options:trickle\r\na=fingerprint:sha-256 E3:25:E3:11:51:3D:A2:4B:AA:B1:A8:EB:DB:03:98:F1:C7:0D:4D:1C:6C:88:EC:BB:20:DA:D0:B7:33:33:BA:8C\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n`,
};

const offer2: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: "v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:esJE\r\na=ice-pwd:oBnbOJv+Sx+NlIqlGhzrVHB+\r\na=ice-options:trickle\r\na=fingerprint:sha-256 61:9B:5A:5A:0A:01:E5:27:4C:B8:E6:04:24:31:E6:D5:D4:96:7D:81:B4:45:A2:55:18:4F:E7:70:91:8F:5A:DA\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:9 G722/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:126 telephone-event/8000\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 35 36 37 38 102 103 104 105 106 107 108 109 127 125 39 40 41 42 43 44 45 46 47 48 112 113 114 115 116 49\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:esJE\r\na=ice-pwd:oBnbOJv+Sx+NlIqlGhzrVHB+\r\na=ice-options:trickle\r\na=fingerprint:sha-256 61:9B:5A:5A:0A:01:E5:27:4C:B8:E6:04:24:31:E6:D5:D4:96:7D:81:B4:45:A2:55:18:4F:E7:70:91:8F:5A:DA\r\na=setup:actpass\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=recvonly\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:35 VP9/90000\r\na=rtcp-fb:35 goog-remb\r\na=rtcp-fb:35 transport-cc\r\na=rtcp-fb:35 ccm fir\r\na=rtcp-fb:35 nack\r\na=rtcp-fb:35 nack pli\r\na=fmtp:35 profile-id=1\r\na=rtpmap:36 rtx/90000\r\na=fmtp:36 apt=35\r\na=rtpmap:37 VP9/90000\r\na=rtcp-fb:37 goog-remb\r\na=rtcp-fb:37 transport-cc\r\na=rtcp-fb:37 ccm fir\r\na=rtcp-fb:37 nack\r\na=rtcp-fb:37 nack pli\r\na=fmtp:37 profile-id=3\r\na=rtpmap:38 rtx/90000\r\na=fmtp:38 apt=37\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=rtpmap:104 H264/90000\r\na=rtcp-fb:104 goog-remb\r\na=rtcp-fb:104 transport-cc\r\na=rtcp-fb:104 ccm fir\r\na=rtcp-fb:104 nack\r\na=rtcp-fb:104 nack pli\r\na=fmtp:104 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\na=rtpmap:105 rtx/90000\r\na=fmtp:105 apt=104\r\na=rtpmap:106 H264/90000\r\na=rtcp-fb:106 goog-remb\r\na=rtcp-fb:106 transport-cc\r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack\r\na=rtcp-fb:106 nack pli\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=106\r\na=rtpmap:108 H264/90000\r\na=rtcp-fb:108 goog-remb\r\na=rtcp-fb:108 transport-cc\r\na=rtcp-fb:108 ccm fir\r\na=rtcp-fb:108 nack\r\na=rtcp-fb:108 nack pli\r\na=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\na=rtpmap:109 rtx/90000\r\na=fmtp:109 apt=108\r\na=rtpmap:127 H264/90000\r\na=rtcp-fb:127 goog-remb\r\na=rtcp-fb:127 transport-cc\r\na=rtcp-fb:127 ccm fir\r\na=rtcp-fb:127 nack\r\na=rtcp-fb:127 nack pli\r\na=fmtp:127 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\na=rtpmap:125 rtx/90000\r\na=fmtp:125 apt=127\r\na=rtpmap:39 H264/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:41 H264/90000\r\na=rtcp-fb:41 goog-remb\r\na=rtcp-fb:41 transport-cc\r\na=rtcp-fb:41 ccm fir\r\na=rtcp-fb:41 nack\r\na=rtcp-fb:41 nack pli\r\na=fmtp:41 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=f4001f\r\na=rtpmap:42 rtx/90000\r\na=fmtp:42 apt=41\r\na=rtpmap:43 H264/90000\r\na=rtcp-fb:43 goog-remb\r\na=rtcp-fb:43 transport-cc\r\na=rtcp-fb:43 ccm fir\r\na=rtcp-fb:43 nack\r\na=rtcp-fb:43 nack pli\r\na=fmtp:43 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=f4001f\r\na=rtpmap:44 rtx/90000\r\na=fmtp:44 apt=43\r\na=rtpmap:45 AV1/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45\r\na=rtpmap:47 AV1/90000\r\na=rtcp-fb:47 goog-remb\r\na=rtcp-fb:47 transport-cc\r\na=rtcp-fb:47 ccm fir\r\na=rtcp-fb:47 nack\r\na=rtcp-fb:47 nack pli\r\na=fmtp:47 profile=1\r\na=rtpmap:48 rtx/90000\r\na=fmtp:48 apt=47\r\na=rtpmap:112 H264/90000\r\na=rtcp-fb:112 goog-remb\r\na=rtcp-fb:112 transport-cc\r\na=rtcp-fb:112 ccm fir\r\na=rtcp-fb:112 nack\r\na=rtcp-fb:112 nack pli\r\na=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtpmap:113 rtx/90000\r\na=fmtp:113 apt=112\r\na=rtpmap:114 red/90000\r\na=rtpmap:115 rtx/90000\r\na=fmtp:115 apt=114\r\na=rtpmap:116 ulpfec/90000\r\na=rtpmap:49 flexfec-03/90000\r\na=rtcp-fb:49 goog-remb\r\na=rtcp-fb:49 transport-cc\r\na=fmtp:49 repair-window=10000000\r\n",
};

const answer2: RTCSessionDescriptionInit = {
  type: "answer",
  sdp: "v=0\r\no=- 4109260023080860376 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:6G3J\r\na=ice-pwd:rWKibBNyIvFgMSKKB3hNYkOr\r\na=ice-options:trickle\r\na=fingerprint:sha-256 61:9B:5A:5A:0A:01:E5:27:4C:B8:E6:04:24:31:E6:D5:D4:96:7D:81:B4:45:A2:55:18:4F:E7:70:91:8F:5A:DA\r\na=setup:active\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=inactive\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:9 G722/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:126 telephone-event/8000\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 103 104 105 106 107 108 109 127 125 39 40 45 46 112 113 114 115 116\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:6G3J\r\na=ice-pwd:rWKibBNyIvFgMSKKB3hNYkOr\r\na=ice-options:trickle\r\na=fingerprint:sha-256 61:9B:5A:5A:0A:01:E5:27:4C:B8:E6:04:24:31:E6:D5:D4:96:7D:81:B4:45:A2:55:18:4F:E7:70:91:8F:5A:DA\r\na=setup:active\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=inactive\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=rtpmap:104 H264/90000\r\na=rtcp-fb:104 goog-remb\r\na=rtcp-fb:104 transport-cc\r\na=rtcp-fb:104 ccm fir\r\na=rtcp-fb:104 nack\r\na=rtcp-fb:104 nack pli\r\na=fmtp:104 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\na=rtpmap:105 rtx/90000\r\na=fmtp:105 apt=104\r\na=rtpmap:106 H264/90000\r\na=rtcp-fb:106 goog-remb\r\na=rtcp-fb:106 transport-cc\r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack\r\na=rtcp-fb:106 nack pli\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=106\r\na=rtpmap:108 H264/90000\r\na=rtcp-fb:108 goog-remb\r\na=rtcp-fb:108 transport-cc\r\na=rtcp-fb:108 ccm fir\r\na=rtcp-fb:108 nack\r\na=rtcp-fb:108 nack pli\r\na=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\na=rtpmap:109 rtx/90000\r\na=fmtp:109 apt=108\r\na=rtpmap:127 H264/90000\r\na=rtcp-fb:127 goog-remb\r\na=rtcp-fb:127 transport-cc\r\na=rtcp-fb:127 ccm fir\r\na=rtcp-fb:127 nack\r\na=rtcp-fb:127 nack pli\r\na=fmtp:127 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\na=rtpmap:125 rtx/90000\r\na=fmtp:125 apt=127\r\na=rtpmap:39 H264/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:45 AV1/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45\r\na=rtpmap:112 H264/90000\r\na=rtcp-fb:112 goog-remb\r\na=rtcp-fb:112 transport-cc\r\na=rtcp-fb:112 ccm fir\r\na=rtcp-fb:112 nack\r\na=rtcp-fb:112 nack pli\r\na=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtpmap:113 rtx/90000\r\na=fmtp:113 apt=112\r\na=rtpmap:114 red/90000\r\na=rtpmap:115 rtx/90000\r\na=fmtp:115 apt=114\r\na=rtpmap:116 ulpfec/90000\r\n",
};

describe("minimize", () => {
  test("compact and decompact offer", () => {
    const compacted = compact(offer);
    const decompacted = decompact(compacted);

    offer.sdp = sdpTransform.write(sdpTransform.parse(offer.sdp as string));
    decompacted.sdp = sdpTransform.write(
      sdpTransform.parse(decompacted.sdp as string)
    );

    expect(offer).toEqual(decompacted);
  });

  test("compactSDP and decompactSDP offer", () => {
    const options: Options = {};

    const sdp = offer.sdp as string;
    const compacted = compactSDP(sdp, options);
    const decompacted = decompactSDP(compacted, true, options);

    console.log("sdp len: " + sdp.length);
    console.log("compact len: " + compacted.length);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });

  ([
    'base64',
    'base92'
  ] as const).forEach((encoding) => {
    test("compactSDP and decompactSDP offer (" + encoding + ")", () => {
      const options: Options = { compress: encoding };

      const sdp = offer.sdp as string;
      const compacted = compactSDP(sdp, options);
      const decompacted = decompactSDP(compacted, true, options);

      console.log("sdp len: " + sdp.length);
      console.log("compact len (" + encoding + "): " + compacted.length);

      expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
    });

    test("compactSDP and decompactSDP offer 2 (" + encoding + ")", () => {
      const options: Options = { compress: encoding };

      const sdp = offer2.sdp as string;
      const compacted = compactSDP(sdp, options);
      const decompacted = decompactSDP(compacted, true, options);

      console.log("sdp len: " + sdp.length);
      console.log("compact len (" + encoding + "): " + compacted.length);

      expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
    });

    test("compactSDP and decompactSDP answer 2 (" + encoding + ")", () => {
      const options: Options = { compress: encoding };

      const sdp = answer2.sdp as string;
      const compacted = compactSDP(sdp, options);
      const decompacted = decompactSDP(compacted, false, options);

      console.log("sdp len: " + sdp.length);
      console.log("compact len (" + encoding + "): " + compacted.length);

      expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
    });
  });

  test("compactSDP and decompactSDP offer no compress", () => {
    const options: Options = { compress: false };

    const sdp = offer2.sdp as string;
    const compacted = compactSDP(sdp, options);
    const decompacted = decompactSDP(compacted, true, options);

    console.log("sdp len: " + sdp.length);
    console.log("compact len: " + compacted.length);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });

  test("compactSDP and decompactSDP answer no compress", () => {
    const options: Options = { compress: false };

    const sdp = answer2.sdp as string;
    const compacted = compactSDP(sdp, options);
    const decompacted = decompactSDP(compacted, false, options);

    console.log("sdp len: " + sdp.length);
    console.log("compact len: " + compacted.length);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });

  test("compactSDP and decompactSDP offer bytes", () => {
    const options: Options = { compress: true };

    const sdp = offer2.sdp as string;
    const compacted = compactSDPBytes(sdp, options);
    const decompacted = decompactSDPBytes(compacted, true, options);

    console.log("sdp len: " + sdp.length);
    console.log("compact len: " + compacted.length);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });

  test("compactSDP and decompactSDP answer bytes", () => {
    const options: Options = { compress: true };

    const sdp = answer2.sdp as string;
    const compacted = compactSDPBytes(sdp, options);
    const decompacted = decompactSDPBytes(compacted, false, options);

    console.log("sdp len: " + sdp.length);
    console.log("compact len: " + compacted.length);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });

  test("extmap compression", () => {
    // Create SDP with extmap attributes
    const sdpWithExtmap = `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\n`;

    // Test with extmap compression enabled
    const optionsWithExtmap: Options = { compress: false, mediaOptions: { compressExtmap: true } };
    const compactedWithExtmap = compactSDP(sdpWithExtmap, optionsWithExtmap);

    // Test with extmap compression disabled
    const optionsWithoutExtmap: Options = { compress: false, mediaOptions: { compressExtmap: false } };
    const compactedWithoutExtmap = compactSDP(sdpWithExtmap, optionsWithoutExtmap);

    // The compressed version should be shorter
    expect(compactedWithExtmap.length).toBeLessThan(compactedWithoutExtmap.length);

    // The compressed version should contain short identifiers instead of full URIs
    expect(compactedWithExtmap).toContain("AE1 A"); // compressed ssrc-audio-level
    expect(compactedWithExtmap).toContain("AE2 B"); // compressed abs-send-time
    expect(compactedWithExtmap).toContain("AE3 C"); // compressed transport-wide-cc-extensions
    expect(compactedWithExtmap).toContain("AE4 D"); // compressed sdes:mid

    // The uncompressed version should still contain full URIs
    expect(compactedWithoutExtmap).toContain("urn:ietf:params:rtp-hdrext:ssrc-audio-level");
    expect(compactedWithoutExtmap).toContain("http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time");

    // Test decompression works correctly - the extmap URIs should be restored
    const decompactedWithExtmap = decompactSDP(compactedWithExtmap, true, optionsWithExtmap);

    // Check that extmap URIs are properly restored
    expect(decompactedWithExtmap).toContain("urn:ietf:params:rtp-hdrext:ssrc-audio-level");
    expect(decompactedWithExtmap).toContain("http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time");
    expect(decompactedWithExtmap).toContain("http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01");
    expect(decompactedWithExtmap).toContain("urn:ietf:params:rtp-hdrext:sdes:mid");
  });

  test("rtcp-fb compression", () => {
    // Create SDP with rtcp-fb attributes
    const sdpWithRtcpFb = `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\n`;

    // Test with rtcp-fb compression enabled
    const optionsWithRtcpFb: Options = { compress: false, mediaOptions: { compressRtcpFb: true } };
    const compactedWithRtcpFb = compactSDP(sdpWithRtcpFb, optionsWithRtcpFb);

    // Test with rtcp-fb compression disabled
    const optionsWithoutRtcpFb: Options = { compress: false, mediaOptions: { compressRtcpFb: false } };
    const compactedWithoutRtcpFb = compactSDP(sdpWithRtcpFb, optionsWithoutRtcpFb);

    // The compressed version should be shorter
    expect(compactedWithRtcpFb.length).toBeLessThan(compactedWithoutRtcpFb.length);

    // The compressed version should contain short identifiers instead of full feedback types
    expect(compactedWithRtcpFb).toContain("AB96 G"); // compressed goog-remb
    expect(compactedWithRtcpFb).toContain("AB96 T"); // compressed transport-cc
    expect(compactedWithRtcpFb).toContain("AB96 C"); // compressed ccm fir
    expect(compactedWithRtcpFb).toContain("AB96 N"); // compressed nack
    expect(compactedWithRtcpFb).toContain("AB96 P"); // compressed nack pli

    // The uncompressed version should still contain full feedback types
    expect(compactedWithoutRtcpFb).toContain("goog-remb");
    expect(compactedWithoutRtcpFb).toContain("transport-cc");
    expect(compactedWithoutRtcpFb).toContain("ccm fir");
    expect(compactedWithoutRtcpFb).toContain("nack pli");

    // Test decompression works correctly
    const decompactedWithRtcpFb = decompactSDP(compactedWithRtcpFb, true, optionsWithRtcpFb);

    // Check that rtcp-fb types are properly restored
    expect(decompactedWithRtcpFb).toContain("goog-remb");
    expect(decompactedWithRtcpFb).toContain("transport-cc");
    expect(decompactedWithRtcpFb).toContain("ccm fir");
    expect(decompactedWithRtcpFb).toContain("nack");
    expect(decompactedWithRtcpFb).toContain("nack pli");
  });

  test("compactSDP/decompactSDP survives an SDP whose deflated payload exceeds the String.fromCharCode spread limit (base64)", () => {
    // Regression: uint8ArrayToBase64 used `String.fromCharCode(...array)`,
    // which spreads the whole deflated buffer as call arguments and throws
    // `RangeError: Maximum call stack size exceeded` once the byte count
    // exceeds the engine's argument limit (~126k on Node v26).
    //
    // Build a valid SDP with many ICE candidates so the deflated (level 9)
    // payload of the COMPACTED string — the exact buffer that reaches
    // uint8ArrayToBase64 — is measured (not guessed) to exceed 120,000
    // bytes.
    //
    // Note: candidate priorities/IPs are chosen so no octet run of zeros
    // (0<*>0<*>0<*>0) occurs: candidateEncode's "0.0.0.0" dict pattern uses
    // unescaped dots and would otherwise leak literal "undefined" into the
    // compacted string (a separate, pre-existing dict bug, out of scope
    // here — cf. zf-224ba8b4).
    const candidateCount = 12000;
    // `a=group:BUNDLE 0..N-1` is required: decompact re-inserts it for every
    // media section (removeMediaID), so the original must carry it for the
    // parsed round-trip to be equal.
    const bundleIDs = Array.from({ length: candidateCount }, (_, i) => i).join(" ");
    const lines: string[] = [
      "v=0",
      "o=- 4109260023080860376 2 IN IP4 127.0.0.1",
      "s=-",
      "t=0 0",
      `a=group:BUNDLE ${bundleIDs}`,
      "a=extmap-allow-mixed",
      "a=msid-semantic: WMS",
    ];
    for (let i = 0; i < candidateCount; i++) {
      const ip = `10.${1 + (i % 250)}.${1 + (i % 200)}.${1 + (i % 150)}`;
      lines.push("m=audio 9 UDP/TLS/RTP/SAVPF 111");
      lines.push("c=IN IP4 0.0.0.0");
      lines.push(
        `a=candidate:${100000 + i} 1 udp ${
          2147483648 + i
        } ${ip} ${10000 + i} typ host generation 0 network-cost 999`
      );
      // decompact re-inserts these for every media section
      // (removeSetup / removeMediaID / forceTrickle), so the original must
      // carry them.
      lines.push("a=setup:actpass");
      lines.push(`a=mid:${i}`);
      lines.push("a=ice-options:trickle");
    }
    const sdp = lines.join("\r\n") + "\r\n";

    // The test is only meaningful if the deflated compacted payload actually
    // crosses the spread limit; otherwise the RangeError could not be
    // reproduced. (Measurement only — not the encoding under test.)
    const compactedPlain = compactSDP(sdp, { compress: false });
    const deflated = deflateSync(strToU8(compactedPlain), { level: 9 });
    console.log("large sdp len: " + sdp.length);
    console.log("large compacted deflated len: " + deflated.length);
    expect(deflated.length).toBeGreaterThan(120000);

    // Default compress: 'base64' — compactSDP must not throw.
    const compacted = compactSDP(sdp);
    console.log("large compact len: " + compacted.length);

    const decompacted = decompactSDP(compacted, true);

    expect(sdpTransform.parse(sdp)).toEqual(sdpTransform.parse(decompacted));
  });
});

describe("base92", () => {
  test("round-trip: base92ToUint8Array(uint8ArrayToBase92(bytes)).equals(bytes)", () => {
    const payloads: Uint8Array[] = [
      new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33]),
      new Uint8Array([0x00, 0x00, 0x01, 0x02, 0x03]), // leading 0x00 -> LEADER repeat path
      new Uint8Array([0x00, 0x00, 0x00, 0xff]), // multiple leading 0x00
      new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]),
      new TextEncoder().encode(
        "v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\nt=0 0\r\n"
      ),
    ];

    for (const bytes of payloads) {
      const encoded = uint8ArrayToBase92(bytes);
      const decoded = base92ToUint8Array(encoded);

      // Re-encoding the decoded bytes must reproduce the original string.
      expect(uint8ArrayToBase92(decoded)).toBe(encoded);
      // Decoded bytes must equal the original payload.
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  test("round-trip: single 0x00 payload (LEADER only)", () => {
    const bytes = new Uint8Array([0x00]);
    const decoded = base92ToUint8Array(uint8ArrayToBase92(bytes));
    expect(Array.from(decoded)).toEqual([0x00]);
  });

  test("empty input returns empty output", () => {
    expect(Array.from(base92ToUint8Array(""))).toEqual([]);
  });

  test("invalid char throws: single space injected into a valid string", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33]);
    const valid = uint8ArrayToBase92(bytes);
    // 0x20 (space) is not in ALPHABET; inject it mid-string.
    const tampered = valid.slice(0, 2) + " " + valid.slice(3);
    expect(() => base92ToUint8Array(tampered)).toThrow();
  });

  test("invalid char throws: tab injected into a valid string", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
    const valid = uint8ArrayToBase92(bytes);
    const tampered = valid.slice(0, 3) + "\t" + valid.slice(4);
    expect(() => base92ToUint8Array(tampered)).toThrow();
  });

  test("fully-invalid input throws: three spaces", () => {
    // 3 spaces (0x20) — none of them are in ALPHABET.
    expect(() => base92ToUint8Array("   ")).toThrow();
  });

  test("fully-invalid input throws: non-alphabet prefix before valid tail", () => {
    // Pick a confirmed-absent char (space) followed by valid base92 chars.
    expect(() => base92ToUint8Array(" !#$")).toThrow();
  });

  test("invalid char throws: non-ASCII (out-of-bounds charCode) char", () => {
    // A non-ASCII char has charCode >= 256 -> BASE_MAP reads undefined,
    // not the INVALID sentinel. Must still throw, not silently corrupt.
    const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const valid = uint8ArrayToBase92(bytes);
    const tampered = valid.slice(0, 2) + "€" + valid.slice(3);
    expect(() => base92ToUint8Array(tampered)).toThrow();
  });

  test("end-to-end: compactSDP/decompactSDP (base92) on a tampered compact string surfaces an error", () => {
    const options: Options = { compress: "base92" };
    const sdp = offer.sdp as string;
    const compacted = compactSDP(sdp, options);
    // Tamper with the compressed base92 payload: inject a space (0x20) mid-string.
    const mid = Math.floor(compacted.length / 2);
    const tampered = compacted.slice(0, mid) + " " + compacted.slice(mid + 1);

    // Decompacting the tampered string must surface an error (not silently
    // return wrong SDP bytes).
    expect(() => decompactSDP(tampered, true, options)).toThrow();
  });
});
