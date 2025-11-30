// index.mjs - Lambda: uide-mediaconverter-pipeline
// Runtime: Node.js 24.x
// Handler: index.handler

import AWS from "aws-sdk";

const REGION = "";

const MEDIACONVERT_ROLE_ARN = "";

const MEDIACONVERT_QUEUE_ARN = "";

// Cliente “descubridor” para obtener el endpoint real de MediaConvert
const mcDiscovery = new AWS.MediaConvert({
  apiVersion: "2017-08-29",
  region: REGION,
});

export const handler = async (event) => {
  console.log("Evento S3 recibido:", JSON.stringify(event, null, 2));

  const record = event.Records?.[0];
  if (!record) {
    console.log("No hay Records en el evento, saliendo.");
    return;
  }

  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  // Solo procesamos input/*.mp4
  if (!key.startsWith("input/") || !key.toLowerCase().endsWith(".mp4")) {
    console.log("Objeto ignorado por prefijo/sufijo:", key);
    return;
  }

  const inputUrl = `s3://${bucket}/${key}`;
  console.log("Input de MediaConvert:", inputUrl);

  try {
    // 1) Obtener endpoint de MediaConvert para tu cuenta
    const endpoints = await mcDiscovery.describeEndpoints().promise();
    const endpointUrl = endpoints.Endpoints?.[0]?.Url;

    if (!endpointUrl) {
      console.error("No se encontró endpoint de MediaConvert");
      return;
    }

    console.log("Endpoint MediaConvert:", endpointUrl);

    // 2) Cliente definitivo de MediaConvert
    const mc = new AWS.MediaConvert({
      apiVersion: "2017-08-29",
      region: REGION,
      endpoint: endpointUrl,
    });

    // 3) Definir el job (es el JSON que tenías en el job manual,
    //    solo cambiamos FileInput para usar el archivo que subió el usuario)
    const params = {
      Role: MEDIACONVERT_ROLE_ARN,
      Queue: MEDIACONVERT_QUEUE_ARN,
      UserMetadata: {},
      Settings: {
        TimecodeConfig: {
          Source: "ZEROBASED",
        },
        OutputGroups: [
          {
            CustomName: "default_coverter_group_apple_hls",
            Name: "Apple HLS",
            Outputs: [
              {
                ContainerSettings: {
                  Container: "M3U8",
                  M3u8Settings: {},
                },
                VideoDescription: {
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      MaxBitrate: 5000000,
                      RateControlMode: "QVBR",
                      QvbrSettings: {
                        QvbrQualityLevel: 8,
                      },
                      SceneChangeDetect: "TRANSITION_DETECTION",
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    AudioSourceName: "Audio Selector 1",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: "CODING_MODE_2_0",
                        SampleRate: 48000,
                      },
                    },
                  },
                ],
                OutputSettings: {
                  HlsSettings: {},
                },
                NameModifier: "_high",
              },
              {
                ContainerSettings: {
                  Container: "M3U8",
                  M3u8Settings: {},
                },
                VideoDescription: {
                  Width: 854,
                  Height: 480,
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      MaxBitrate: 1500000,
                      RateControlMode: "QVBR",
                      QvbrSettings: {
                        QvbrQualityLevel: 1,
                      },
                      SceneChangeDetect: "TRANSITION_DETECTION",
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: "CODING_MODE_2_0",
                        SampleRate: 48000,
                      },
                    },
                  },
                ],
                OutputSettings: {
                  HlsSettings: {},
                },
                NameModifier: "_low",
              },
            ],
            OutputGroupSettings: {
              Type: "HLS_GROUP_SETTINGS",
              HlsGroupSettings: {
                SegmentLength: 10,
                MinSegmentLength: 0,
                Destination: "s3://uide-jarvis-front/output/",
              },
            },
          },
        ],
        FollowSource: 1,
        Inputs: [
          {
            AudioSelectors: {
              "Audio Selector 1": {
                DefaultSelection: "DEFAULT",
              },
            },
            VideoSelector: {},
            TimecodeSource: "ZEROBASED",
            FileInput: inputUrl, // 👈 aquí va el video recién subido
          },
        ],
      },
      BillingTagsSource: "JOB",
      AccelerationSettings: {
        Mode: "DISABLED",
      },
      StatusUpdateInterval: "SECONDS_60",
      Priority: 0,
    };

    console.log("Creando job de MediaConvert...");
    const result = await mc.createJob(params).promise();
    console.log("Job de MediaConvert creado:", result.Job.Id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Job creado OK",
        jobId: result.Job.Id,
      }),
    };
  } catch (err) {
    console.error("Error creando job de MediaConvert:", err);
    throw err;
  }
};
