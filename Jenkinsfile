pipeline {
    agent any

    environment {
        IMAGE_TAG = "${BUILD_NUMBER}"
        APP_NAME = "backend-app"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $APP_NAME:$IMAGE_TAG .'
            }
        }

        stage('Save Previous Version') {
            steps {
                sh '''
                PREV_TAG=$(docker ps -a --filter name=backend --format "{{.Image}}" | cut -d: -f2)
                echo $PREV_TAG > prev_tag.txt || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                export IMAGE_TAG=$IMAGE_TAG
                docker-compose down
                docker-compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sh 'sleep 15'

                    def status = sh(
                        script: 'curl -f http://localhost/api/hello',
                        returnStatus: true
                    )

                    if (status != 0) {
                        error "Health check failed"
                    }
                }
            }
        }
    }

    post {
        failure {
            echo 'Rolling back...'

            sh '''
            PREV_TAG=$(cat prev_tag.txt)

            if [ ! -z "$PREV_TAG" ]; then
                echo "Rolling back to $PREV_TAG"

                export IMAGE_TAG=$PREV_TAG
                docker-compose down
                docker-compose up -d
            else
                echo "No previous version found"
            fi
            '''
        }
    }
}
